export type Role = "user" | "bot";

export interface MessageType {
  id: string;
  role: Role;
  content: string;
  loading?: boolean;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: MessageType[];
}
