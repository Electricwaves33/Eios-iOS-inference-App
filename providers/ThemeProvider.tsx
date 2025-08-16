import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Chat, Message } from "@/types/chat";
import { generateChatTitle, sendAIMessage, parseSlashCommand } from "@/utils/aiService";
import { useTheme } from "@/providers/ThemeProvider";

interface ChatContextType {
  chats: Chat[];
  createChat: () => Promise<string>;
  deleteChat: (chatId: string) => void;
  clearAllChats: () => void;
  getChat: (chatId: string) => Chat | undefined;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  exportChat: (chatId: string) => string;
  isLoading: boolean;
  isOffline: boolean;
}

export const [ChatProvider, useChats] = createContextHook<ChatContextType>(() => {
  const { settings, updateSettings } = useTheme();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const saveChats = useCallback(async () => {
    try {
      await AsyncStorage.setItem("chats", JSON.stringify(chats));
    } catch (error) {
      console.error("Error saving chats:", error);
    }
  }, [chats]);

  const loadChats = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("chats");
      if (stored) {
        setChats(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (!isLoading) {
      saveChats();
    }
  }, [chats, isLoading, saveChats]);

  const createChat = useCallback(async (): Promise<string> => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: settings.selectedModel,
    };
    
    setChats(prev => [newChat, ...prev]);
    return newChat.id;
  }, [settings.selectedModel]);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
  }, []);

  const clearAllChats = useCallback(() => {
    setChats([]);
  }, []);

  const getChat = useCallback((chatId: string): Chat | undefined => {
    return chats.find(chat => chat.id === chatId);
  }, [chats]);

  const exportChat = useCallback((chatId: string): string => {
    const chat = getChat(chatId);
    if (!chat) return "";
    
    let exportText = `Chat: ${chat.title}\nModel: ${chat.model}\nDate: ${new Date(chat.createdAt).toLocaleString()}\n\n`;
    
    chat.messages.forEach(msg => {
      const role = msg.role === "user" ? "You" : "AI";
      exportText += `${role}: ${msg.content}\n\n`;
    });
    
    return exportText;
  }, [getChat]);

  const sendMessage = useCallback(async (chatId: string, content: string) => {
    const chat = getChat(chatId);
    if (!chat) return;

    // Handle slash commands
    const slashCommand = parseSlashCommand(content);
    if (slashCommand) {
      switch (slashCommand.command) {
        case 'clear':
          setChats(prev => prev.map(c => 
            c.id === chatId ? { ...c, messages: [], updatedAt: Date.now() } : c
          ));
          return;
        case 'model':
          if (slashCommand.args) {
            updateSettings({ selectedModel: slashCommand.args });
            const systemMessage: Message = {
              id: Date.now().toString(),
              role: "system",
              content: `Switched to model: ${slashCommand.args}`,
              timestamp: Date.now(),
            };
            setChats(prev => prev.map(c => 
              c.id === chatId ? { 
                ...c, 
                messages: [...c.messages, systemMessage], 
                model: slashCommand.args,
                updatedAt: Date.now() 
              } : c
            ));
          }
          return;
        case 'export':
          const exportText = exportChat(chatId);
          console.log("Chat exported:", exportText);
          return;
        default:
          // Unknown command, treat as regular message
          break;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    const updatedChat = {
      ...chat,
      messages: [...chat.messages, userMessage],
      updatedAt: Date.now(),
    };

    setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c));

    try {
      setIsOffline(false);
      const aiResponse = await sendAIMessage(
        updatedChat.messages,
        settings.selectedModel,
        settings
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: Date.now(),
      };

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage],
        updatedAt: Date.now(),
      };

      if (chat.messages.length === 0) {
        const title = await generateChatTitle(content, settings);
        finalChat.title = title;
      }

      setChats(prev => prev.map(c => c.id === chatId ? finalChat : c));
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Handle offline scenario
      if (error instanceof Error && (error.message.includes('Network') || error.message.includes('fetch'))) {
        setIsOffline(true);
        
        // Add offline response
        const offlineMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'm currently offline. Your message has been saved and I'll respond when connection is restored. You can continue browsing your chat history.",
          timestamp: Date.now(),
        };

        const offlineChat = {
          ...updatedChat,
          messages: [...updatedChat.messages, offlineMessage],
          updatedAt: Date.now(),
        };

        setChats(prev => prev.map(c => c.id === chatId ? offlineChat : c));
      } else {
        throw error;
      }
    }
  }, [getChat, settings, updateSettings, exportChat]);

  return useMemo(() => ({
    chats,
    createChat,
    deleteChat,
    clearAllChats,
    getChat,
    sendMessage,
    exportChat,
    isLoading,
    isOffline,
  }), [chats, createChat, deleteChat, clearAllChats, getChat, sendMessage, exportChat, isLoading, isOffline]);
});