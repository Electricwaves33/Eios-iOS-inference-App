export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: "openrouter" | "openai" | "custom";
  apiFormat: "openai" | "openrouter";
  free: boolean;
}

export interface Theme {
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    userBubble: string;
    aiBubble: string;
    userText: string;
    aiText: string;
    inputBackground: string;
    headerBackground: string;
  };
}

export interface AppSettings {
  theme: string;
  selectedModel: string;
  apiKeys: {
    openrouter?: string;
    openai?: string;
    custom?: string;
  };
  customEndpoint?: string;
  streamingEnabled: boolean;
}