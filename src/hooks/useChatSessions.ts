import { useState, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastActivity: Date;
  unreadCount?: number;
}

const STORAGE_KEY = 'chat-sessions';

export function useChatSessions() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const sessions = parsed.map((session: any) => ({
          ...session,
          lastActivity: new Date(session.lastActivity),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatSessions(sessions);
      } else {
        // Initialize with default chat if no stored sessions
        const defaultChat: ChatSession = {
          id: 'default-chat',
          title: 'New Chat',
          messages: [],
          lastActivity: new Date()
        };
        setChatSessions([defaultChat]);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      // Initialize with default chat on error
      const defaultChat: ChatSession = {
        id: 'default-chat',
        title: 'New Chat',
        messages: [],
        lastActivity: new Date()
      };
      setChatSessions([defaultChat]);
    }
    setIsLoaded(true);
  }, []);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chatSessions));
      } catch (error) {
        console.error('Error saving chat sessions:', error);
      }
    }
  }, [chatSessions, isLoaded]);

  const addChatSession = (chat: ChatSession) => {
    setChatSessions(prev => [chat, ...prev]);
  };

  const updateChatSession = (chatId: string, updates: Partial<ChatSession>) => {
    setChatSessions(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, ...updates } : chat
    ));
  };

  const deleteChatSession = (chatId: string) => {
    setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
  };

  const getChatSession = (chatId: string) => {
    return chatSessions.find(chat => chat.id === chatId);
  };

  const ensureChatExists = (chatId: string) => {
    const existingChat = getChatSession(chatId);
    if (!existingChat) {
      const newChat: ChatSession = {
        id: chatId,
        title: chatId === 'default-chat' ? 'New Chat' : 'New Chat',
        messages: [],
        lastActivity: new Date()
      };
      addChatSession(newChat);
      return newChat;
    }
    return existingChat;
  };

  return {
    chatSessions,
    isLoaded,
    addChatSession,
    updateChatSession,
    deleteChatSession,
    getChatSession,
    ensureChatExists,
    setChatSessions
  };
} 