import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageSquare, Menu, Moon, Sun, Plus, Clock, X, Layout } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../lib/utils';
import { useChat } from 'ai/react';
import ChatSidebar from './ChatSidebar';

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

interface ChatPanelProps {
  theme: 'light' | 'dark';
  currentChatId: string;
  onTextDrag: (text: string, messageId: string, chatId: string) => void;
  highlightedMessageId: string | null;
  onHighlightComplete: () => void;
  onNewChat?: () => void;
  onThemeToggle?: () => void;
  onChatSelect?: (chatId: string) => void;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  onCanvasToggle?: () => void;
}

// Simple markdown renderer for basic formatting
const renderMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2">$1</h3>') // H3
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>') // H2
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>') // H1
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>') // List items
    .replace(/\n\n/g, '<br><br>') // Double line breaks
    .replace(/\n/g, '<br>'); // Single line breaks
};



const ChatPanel: React.FC<ChatPanelProps> = ({ 
  theme,
  currentChatId,
  onTextDrag, 
  highlightedMessageId, 
  onHighlightComplete,
  onNewChat,
  onThemeToggle,
  onChatSelect,
  isSidebarOpen,
  onSidebarToggle,
  onCanvasToggle
}) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: 'default-chat',
      title: 'New Chat',
      messages: [],
      lastActivity: new Date()
    }
  ]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentChat = chatSessions?.find(chat => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  // Convert chat messages to ai/react format
  const aiMessages = messages.map(msg => ({
    id: msg.id,
    role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.content
  }));

  // Use the useChat hook with a key to reset when chat changes
  const { input, handleInputChange, handleSubmit, isLoading, messages: aiReactMessages, setMessages } = useChat({
    api: '/api/chat',
    initialMessages: aiMessages,
    id: currentChatId, // This ensures the hook resets when chat changes
    onFinish: (message) => {
      // Add the AI response to our chat sessions
      const aiMessage: Message = {
        id: message.id,
        type: 'ai',
        content: message.content,
        timestamp: new Date()
      };
      
      setChatSessions(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, aiMessage],
            lastActivity: new Date()
          };
        }
        return chat;
      }));
    }
  });

  // Reset useChat messages when switching chats
  useEffect(() => {
    setMessages(aiMessages);
  }, [currentChatId, aiMessages, setMessages]);

  // Update chat sessions when user messages are added
  useEffect(() => {
    const userMessages = aiReactMessages.filter(msg => msg.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (lastUserMessage && !messages.find(msg => msg.id === lastUserMessage.id)) {
      const newUserMessage: Message = {
        id: lastUserMessage.id,
        type: 'user',
        content: lastUserMessage.content,
        timestamp: new Date()
      };
      
      setChatSessions(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, newUserMessage],
            lastActivity: new Date()
          };
        }
        return chat;
      }));
    }
  }, [aiReactMessages, currentChatId, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = useCallback((messageId: string) => {
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentChatId, aiReactMessages]);

  useEffect(() => {
    if (highlightedMessageId) {
      scrollToMessage(highlightedMessageId);
      
      const timer = setTimeout(() => {
        onHighlightComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [highlightedMessageId, scrollToMessage, onHighlightComplete]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleTextSelection = (messageId: string, selectedText: string) => {
    if (selectedText.trim()) {
      onTextDrag(selectedText.trim(), messageId, currentChatId);
    }
  };

  const handleMouseUp = (messageId: string) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      handleTextSelection(messageId, selection.toString());
    }
  };

  const setMessageRef = useCallback((messageId: string, element: HTMLDivElement | null) => {
    if (element) {
      messageRefs.current.set(messageId, element);
    } else {
      messageRefs.current.delete(messageId);
    }
  }, []);

  const handleNewChatClick = () => {
    const newChatId = `new-chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      lastActivity: new Date()
    };
    
    setChatSessions(prev => [newChat, ...prev]);
    onChatSelect?.(newChatId);
  };

  const handleChatDelete = (chatId: string) => {
    setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
    
    // If deleting current chat, switch to another one
    if (currentChatId === chatId) {
      const remainingChats = chatSessions.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        onChatSelect?.(remainingChats[0].id);
      }
    }
  };

  const handleChatUpdate = (chatId: string, updates: Partial<ChatSession>) => {
    setChatSessions(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, ...updates } : chat
    ));
  };

  // Ensure current chat exists
  useEffect(() => {
    if (!currentChat) {
      const newChat: ChatSession = {
        id: currentChatId,
        title: currentChatId === 'default-chat' ? 'New Chat' : 'New Chat',
        messages: [],
        lastActivity: new Date()
      };
      setChatSessions(prev => [newChat, ...prev]);
    }
  }, [currentChatId, currentChat]);

  // Calculate the correct margin based on sidebar state
  const getSidebarMargin = () => {
    if (!isSidebarOpen) return '0px';
    return isSidebarCollapsed ? '80px' : '270px';
  };

  return (
    <div className="flex flex-col h-full relative" style={{ backgroundColor: '#272725' }}>
      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={onSidebarToggle}
        currentChatId={currentChatId}
        chatSessions={chatSessions}
        onChatSelect={onChatSelect || (() => {})}
        onNewChat={handleNewChatClick}
        onChatDelete={handleChatDelete}
        onChatUpdate={handleChatUpdate}
        onCollapsedChange={setIsSidebarCollapsed}
      />

      {/* Main Chat Content */}
      <div 
        className="flex flex-col h-full transition-all duration-300"
        style={{
          marginLeft: getSidebarMargin()
        }}
      >
        {/* Top Controls */}
        <div className="flex items-center justify-end gap-2 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCanvasToggle}
            className="h-10 w-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
            title="Toggle Canvas"
          >
            <Layout className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            className="h-10 w-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="px-8 py-4 space-y-8 max-w-5xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                ref={(el) => setMessageRef(message.id, el)}
                className={cn(
                  "group relative",
                  highlightedMessageId === message.id && "animate-pulse"
                )}
              >
                <div className={cn(
                  "flex gap-6",
                  message.type === 'user' ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[90%] rounded-3xl px-6 py-4 transition-all duration-300",
                    message.type === 'user'
                      ? "ml-16"
                      : "mr-16",
                    highlightedMessageId === message.id && "ring-2 ring-blue-400 ring-offset-2"
                  )}
                  style={{
                    backgroundColor: message.type === 'user' ? '#373432' : 'transparent',
                    color: '#ffffff'
                  }}>
                    <div 
                      className="text-base leading-relaxed whitespace-pre-wrap cursor-text"
                      onMouseUp={() => handleMouseUp(message.id)}
                      style={{ userSelect: 'text' }}
                      dangerouslySetInnerHTML={{ 
                        __html: message.type === 'ai' ? renderMarkdown(message.content) : message.content 
                      }}
                    />
                    <div className="text-xs mt-3 opacity-70 text-gray-300">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-3xl px-6 py-4 mr-16" style={{ backgroundColor: 'transparent' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-sm text-gray-400">
                      hmmm...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div 
          className="p-4"
        >
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="w-full resize-none rounded-3xl border px-6 py-4 pr-16 text-base focus:outline-none focus:ring-0 focus:border-transparent transition-all duration-200 min-h-[56px] max-h-40 text-white"
                  style={{
                    backgroundColor: '#373432',
                    borderColor: '#3a3835'
                  }}
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                  }}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;