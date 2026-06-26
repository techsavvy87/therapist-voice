import React, { FC } from "react";
import { useEffect, useState } from "react";

export interface MessageType {
  id: string;
  role: "bot" | "user";
  content: string;
  loading?: boolean;
  error?: boolean;
  isAudio?: boolean;
}

interface MessageProps {
  message: MessageType;
}

const Message: FC<MessageProps> = ({ message }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // skip server HTML
  return (
    <div
      id={message.id}
      className={`message ${message.role}-message ${
        message.loading ? "loading" : ""
      } ${message.error ? "error" : ""}`}
    >
      {message.role === "bot" && (
        <img className="avatar" src="gemini.svg" alt="Bot Avatar" />
      )}
      {message.isAudio ? (
        <button
          className="download-audio-btn underline"
          onClick={() => {
            const a = document.createElement("a");
            a.href = message.content; // e.g., "/sample.mp3"
            a.download = "hello_world.mp3"; // desired filename
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
        >
          hello_world.mp3
        </button>
      ) : (
        <p className="text">{message.content}</p>
      )}
    </div>
  );
};

export default Message;
