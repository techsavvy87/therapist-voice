import { FC, useEffect, useState } from "react";
import { Menu, Moon, Plus, Sparkles, Sun, Trash2 } from "lucide-react";

import { Conversation } from "@/app/types";

interface SidebarProps {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeConversation: string;
  setActiveConversation: (id: string) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const Sidebar: FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  conversations,
  setConversations,
  activeConversation,
  setActiveConversation,
  theme,
  setTheme,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create new conversation
  const createNewConversation = () => {
    const emptyConversation = conversations.find(
      (conv) => conv.messages.length === 0
    );

    if (emptyConversation) {
      setActiveConversation(emptyConversation.id);
      return;
    }

    const newId = `conv-${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      title: "New Chat",
      messages: [],
    };

    setConversations([newConversation, ...conversations]);
    setActiveConversation(newId);
  };

  // Delete conversation
  const deleteConversation = (
    id: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    if (conversations.length === 1) {
      const newConv: Conversation = {
        id: "default",
        title: "New Chat",
        messages: [],
      };

      setConversations([newConv]);
      setActiveConversation("default");
      return;
    }

    const updatedList = conversations.filter((conv) => conv.id !== id);
    setConversations(updatedList);

    if (activeConversation === id) {
      setActiveConversation(updatedList[0].id);
    }
  };

  return (
    <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <button
          className="sidebar-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu size={18} />
        </button>

        <button className="new-chat-btn" onClick={createNewConversation}>
          <Plus size={20} />
          <span>New chat</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="sidebar-content">
        <h2 className="sidebar-title">Chat history</h2>

        <ul className="conversation-list">
          {isMounted &&
            conversations.map((conv) => (
              <li
                key={conv.id}
                className={`conversation-item ${
                  activeConversation === conv.id ? "active" : ""
                }`}
                onClick={() => setActiveConversation(conv.id)}
              >
                <div className="conversation-icon-title">
                  <div className="conversation-icon">
                    <Sparkles size={14} />
                  </div>
                  {isMounted && (
                    <span className="conversation-title">{conv.title}</span>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  className={`delete-btn ${
                    conversations.length > 1 || conv.title !== "New Chat"
                      ? ""
                      : "hide"
                  }`}
                  onClick={(e) => deleteConversation(conv.id, e)}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
        </ul>
      </div>

      {/* Theme Toggle */}
      <div className="sidebar-footer">
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? (
            <>
              <Moon size={20} />
              <span>Dark mode</span>
            </>
          ) : (
            <>
              <Sun size={20} />
              <span>Light mode</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
