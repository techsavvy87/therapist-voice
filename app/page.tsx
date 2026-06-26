"use client";

import { useEffect, useRef, useState } from "react";
import Message from "./components/chat/Message";
import PromptForm from "./components/chat/PromptForm";
import Sidebar from "./components/sidebar/Sidebar";
import { Menu } from "lucide-react";
import { Conversation, MessageType } from "./types";

const Home: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Main app state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const typingInterval = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsSidebarOpen(window.innerWidth > 768);
  }, []);

  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // useEffect(() => {
  //   // Run only on the client
  //   const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
  //   if (savedTheme) {
  //     setTheme(savedTheme);
  //   } else {
  //     const prefersDark = window.matchMedia(
  //       "(prefers-color-scheme: dark)"
  //     ).matches;
  //     setTheme(prefersDark ? "dark" : "light");
  //   }
  // }, []);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem("conversations");
      return saved
        ? JSON.parse(saved)
        : [{ id: "default", title: "New Chat", messages: [] }];
    } catch {
      return [{ id: "default", title: "New Chat", messages: [] }];
    }
  });

  const [activeConversation, setActiveConversation] =
    useState<string>("default");

  // Read from localStorage on client side
  useEffect(() => {
    const saved = localStorage.getItem("activeConversation");
    if (saved) setActiveConversation(saved);
  }, []);

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeConversation", activeConversation);
  }, [activeConversation]);

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const currentConversation =
    conversations.find((c) => c.id === activeConversation) || conversations[0];

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, activeConversation]);

  const typingEffect = (text: string, messageId: string) => {
    const textElement = document.querySelector(`#${messageId} .text`);
    console.log("Typing effect for message ID:", messageId, "with text:", text);
    if (!textElement) return;

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation
          ? {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === messageId
                  ? { ...msg, content: "", loading: true }
                  : msg
              ),
            }
          : conv
      )
    );

    textElement.textContent = "";
    const words = text.split(" ");
    let wordIndex = 0;
    let currentText = "";

    if (typingInterval.current) clearInterval(typingInterval.current);

    typingInterval.current = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
        textElement.textContent = currentText;

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversation
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId
                      ? { ...msg, content: currentText, loading: true }
                      : msg
                  ),
                }
              : conv
          )
        );

        scrollToBottom();
      } else {
        if (typingInterval.current) clearInterval(typingInterval.current);

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversation
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId
                      ? { ...msg, content: currentText, loading: false }
                      : msg
                  ),
                }
              : conv
          )
        );

        setIsLoading(false);
      }
    }, 40);
  };

  const generateResponse = async (
    conversation: Conversation,
    botMessageId: string
  ) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const userInput = lastMessage.content;

    const wantsAudio =
      userInput.toLowerCase().includes("audio") ||
      userInput.toLowerCase().includes("speak");

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (wantsAudio) {
      try {
        console.log("Generating audio response...");

        // Display text
        const responseText = "Audio OK";
        typingEffect(responseText, botMessageId);

        // After typing effect, add audio message
        setTimeout(() => {
          updateBotMessage(botMessageId, "/hello_world.mp3", false, true); // true = isAudio
        }, 500);
      } catch (error: any) {
        updateBotMessage(botMessageId, error.message, true);
      }
    } else {
      // Text response (existing code)
      const formattedMessages = conversation.messages.map((msg) => ({
        role: msg.role === "bot" ? "assistant" : "user",
        content: msg.content,
      }));

      try {
        const API_URL = "https://api.openai.com/v1/chat/completions";

        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: formattedMessages,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error.message);

        const responseText = data.choices?.[0]?.message?.content?.trim() || "";
        typingEffect(responseText, botMessageId);
      } catch (error: any) {
        updateBotMessage(botMessageId, error.message, true);
      }
    }
  };

  const updateBotMessage = (
    botId: string,
    content: string,
    isError = false,
    isAudio = false
  ) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation
          ? {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === botId
                  ? { ...msg, content, loading: false, error: isError, isAudio }
                  : msg
              ),
            }
          : conv
      )
    );
  };

  return (
    <div
      className={`app-container ${
        theme === "light" ? "light-theme" : "dark-theme"
      }`}
    >
      <div
        className={`overlay ${isSidebarOpen ? "show" : "hide"}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>
      <Sidebar
        conversations={conversations}
        setConversations={setConversations}
        activeConversation={activeConversation}
        setActiveConversation={setActiveConversation}
        theme={theme}
        setTheme={setTheme}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <main className="main-container">
        <header className="main-header">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="sidebar-toggle"
          >
            <Menu size={18} />
          </button>
        </header>
        {mounted &&
          (currentConversation.messages.length === 0 ? (
            <div className="welcome-container">
              <img
                className="welcome-logo"
                src="gemini.svg"
                alt="Gemini Logo"
              />
              <h1 className="welcome-heading">Message Therapist</h1>
              <p className="welcome-text">
                Ask me anything about any topic. I'm here to help!
              </p>
            </div>
          ) : (
            <div className="messages-container" ref={messagesContainerRef}>
              {currentConversation.messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
            </div>
          ))}
        <div className="prompt-container">
          <div className="prompt-wrapper">
            <PromptForm
              conversations={conversations}
              setConversations={setConversations}
              activeConversation={activeConversation}
              generateResponse={generateResponse}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>
          <p className="disclaimer-text">
            Therapist can make mistakes, so double-check it.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Home;
