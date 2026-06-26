"use client";

import { Plus, ArrowUp } from "lucide-react";
import { useState, FormEvent, ChangeEvent, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  loading?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

interface PromptFormProps {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeConversation: string;
  generateResponse: (conversation: Conversation, botMessageId: string) => void;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleUploadAudio?: (file: File) => void | Promise<void>; // optional prop for audio upload
}

const PromptForm: React.FC<PromptFormProps> = ({
  conversations,
  setConversations,
  activeConversation,
  generateResponse,
  isLoading,
  setIsLoading,
  handleUploadAudio,
}) => {
  const [promptText, setPromptText] = useState<string>("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading || !promptText.trim()) return;

    setIsLoading(true);

    const currentConvo =
      conversations.find((convo) => convo.id === activeConversation) ||
      conversations[0];

    let newTitle = currentConvo.title;
    if (currentConvo.messages.length === 0) {
      newTitle =
        promptText.length > 25
          ? promptText.substring(0, 25) + "..."
          : promptText;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: promptText,
    };

    const apiConversation: Conversation = {
      ...currentConvo,
      messages: [...currentConvo.messages, userMessage],
    };

    setConversations(
      conversations.map((conv) =>
        conv.id === activeConversation
          ? {
              ...conv,
              title: newTitle,
              messages: [...conv.messages, userMessage],
            }
          : conv
      )
    );

    setPromptText("");
    setIsAudioLoading(false); // reset audio spinner after submit

    setTimeout(() => {
      const botMessageId = `bot-${Date.now()}`;
      const botMessage: Message = {
        id: botMessageId,
        role: "bot",
        content: "Just a sec...",
        loading: true,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversation
            ? {
                ...conv,
                title: newTitle,
                messages: [...conv.messages, botMessage],
              }
            : conv
        )
      );

      generateResponse(apiConversation, botMessageId);
    }, 300);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPromptText(e.target.value);

  const handlePlusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsUploadOpen(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Display file name in prompt input
    setPromptText(file.name);

    // Show spinner
    setIsAudioLoading(true);

    if (handleUploadAudio) {
      // If upload handler is async, hide spinner when done
      const result = handleUploadAudio(file);
      if (result instanceof Promise) {
        result.finally(() => setIsAudioLoading(false));
      } else {
        // Synchronous handler
        setIsAudioLoading(false);
      }
    } else {
      // Simulate file processing delay
      setTimeout(() => setIsAudioLoading(false), 1000);
    }

    setIsUploadOpen(false);
  };

  const handleClosePopup = () => setIsUploadOpen(false);

  return (
    <div className="relative w-full">
      <form className="prompt-form flex items-center" onSubmit={handleSubmit}>
        {/* Plus icon + spinner */}
        <div className="relative flex items-center pl-5">
          <button onClick={handlePlusClick} className="relative z-10">
            <Plus size={20} color="white" className="cursor-pointer" />
          </button>

          {/* Spinner next to Plus */}
          {isAudioLoading && (
            <div className="absolute left-6 top-1/2 transform -translate-y-1/2 ml-[18px]">
              <svg
                className="animate-spin h-4 w-4 text-yellow-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Text input */}
        <input
          placeholder="Ask me anything..."
          className="prompt-input w-full p-2 rounded pr-8" // add padding-right for spinner
          value={promptText}
          onChange={handleChange}
          required
        />

        {/* Send button */}
        <button type="submit" className="send-prompt-btn">
          <ArrowUp size={20} />
        </button>
      </form>

      {/* Audio Upload Popup */}
      {isUploadOpen && (
        <div className="absolute bottom-12 left-0 bg-gray-800 text-white p-4 rounded shadow-lg z-50">
          <h3 className="mb-2 font-semibold">Upload Audio</h3>
          <input
            type="file"
            accept="audio/*"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={handleClosePopup}
            className="mt-2 bg-red-500 px-3 py-1 rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default PromptForm;
