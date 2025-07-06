import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageSquare, Menu, Moon, Sun, Plus, Clock, X, Layout } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../lib/utils';
import { useChat } from 'ai/react';
import ChatSidebar from './ChatSidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useRouter } from 'next/navigation';
import { useChatSessions } from '../hooks/useChatSessions';

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

// Markdown renderer component with text selection support
const MarkdownRenderer: React.FC<{ content: string; messageId: string; onTextSelection: (messageId: string, selectedText: string) => void }> = ({ 
  content, 
  messageId, 
  onTextSelection 
}) => {
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      onTextSelection(messageId, selection.toString());
    }
  };

  return (
    <div 
      className="text-base leading-relaxed cursor-text"
      onMouseUp={handleMouseUp}
      style={{ userSelect: 'text' }}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom styling for markdown elements
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mb-2">{children}</h3>,
          p: (props) => {
            // Remove margin if inside a list item
            const node: any = props.node;
            if (node?.parent?.type === 'listItem') {
              return <p className="mb-0 leading-relaxed">{props.children}</p>;
            }
            // Add a small top margin for paragraphs after lists
            return <p className="mt-1 mb-4 leading-relaxed">{props.children}</p>;
          },
          ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2" style={{ counterReset: 'list-counter' }}>{children}</ol>,
          li: ({ children }) => <li className="ml-4 leading-relaxed" style={{ display: 'list-item' }}>{children}</li>,
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  style={{
                    background: '#393a36',
                    color: '#9a9fa1',
                    padding: '0.01em 0.5em 0.2rem',
                    borderRadius: '9999px',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                  }}
                >
                  {children}
                </code>
              );
            }
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            return (
              <div className="mb-6">
                <SyntaxHighlighter
                  style={oneDark}
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: '8px',
                    backgroundColor: '#373432',
                  }}
                  codeTagProps={{
                    style: { background: 'none' }
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-600 pl-4 italic mb-4">{children}</blockquote>
          ),
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          // Handle text nodes to prevent unwanted line breaks
          text: ({ children }) => <span>{children}</span>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
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
  const router = useRouter();
  const { 
    chatSessions, 
    isLoaded, 
    addChatSession, 
    updateChatSession, 
    deleteChatSession, 
    getChatSession,
    ensureChatExists,
    setChatSessions 
  } = useChatSessions();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightCooldownRef = useRef<number>(0);

  // Ensure current chat exists when component mounts
  useEffect(() => {
    if (isLoaded && currentChatId) {
      ensureChatExists(currentChatId);
    }
  }, [isLoaded, currentChatId, ensureChatExists]);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, []);

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
      
      updateChatSession(currentChatId, {
        messages: [...(getChatSession(currentChatId)?.messages || []), aiMessage],
        lastActivity: new Date()
      });
    }
  });

  // Resize textarea when input changes
  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

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
      
      updateChatSession(currentChatId, {
        messages: [...(getChatSession(currentChatId)?.messages || []), newUserMessage],
        lastActivity: new Date()
      });
    }
  }, [aiReactMessages, currentChatId, messages, updateChatSession, getChatSession]);

  const scrollToBottom = () => {
    // Don't scroll to bottom if a message is highlighted
    if (!highlightedMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
    if (!highlightedMessageId) {
      // Only scroll to bottom if enough time has passed since highlight was cleared
      const now = Date.now();
      if (now - highlightCooldownRef.current > 1000) {
        scrollToBottom();
      }
    }
  }, [messages, currentChatId, aiReactMessages, highlightedMessageId]);

  useEffect(() => {
    if (highlightedMessageId) {
      // Add a small delay to ensure the message is rendered
      const timer = setTimeout(() => {
        scrollToMessage(highlightedMessageId);
      }, 100);
      
      const clearTimer = setTimeout(() => {
        onHighlightComplete();
        highlightCooldownRef.current = Date.now(); // Set cooldown timestamp
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
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
    
    addChatSession(newChat);
    router.push(`/chat/${newChatId}`);
  };

  const handleChatDelete = (chatId: string) => {
    deleteChatSession(chatId);
    
    // If deleting current chat, switch to another one
    if (currentChatId === chatId) {
      const remainingChats = chatSessions.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        router.push(`/chat/${remainingChats[0].id}`);
      } else {
        // If no chats left, create a new one
        const newChatId = `new-chat-${Date.now()}`;
        const newChat: ChatSession = {
          id: newChatId,
          title: 'New Chat',
          messages: [],
          lastActivity: new Date()
        };
        addChatSession(newChat);
        router.push(`/chat/${newChatId}`);
      }
    }
  };

  const handleChatUpdate = (chatId: string, updates: Partial<ChatSession>) => {
    updateChatSession(chatId, updates);
  };



  // Calculate the correct margin based on sidebar state
  const getSidebarMargin = () => {
    if (!isSidebarOpen) return '0px';
    return isSidebarCollapsed ? '80px' : '270px';
  };

  // Show loading state while chat sessions are loading
  if (!isLoaded) {
    return (
      <div className="flex flex-col h-full relative" style={{ backgroundColor: '#272725' }}>
        <div className="flex items-center justify-center h-full">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    );
  }

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
                    {message.type === 'ai' ? (
                      <MarkdownRenderer 
                        content={message.content}
                        messageId={message.id}
                        onTextSelection={handleTextSelection}
                      />
                    ) : (
                      <div 
                        className="text-base leading-relaxed whitespace-pre-wrap cursor-text"
                        onMouseUp={() => handleMouseUp(message.id)}
                        style={{ userSelect: 'text' }}
                      >
                        {message.content}
                      </div>
                    )}
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
          <div className="max-w-5xl mx-auto px-20">
            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything"
                  className="w-full resize-none rounded-3xl border px-6 py-4 pr-16 text-base focus:outline-none focus:ring-0 focus:border-transparent transition-all duration-200 min-h-[56px] max-h-40 text-white"
                  style={{
                    backgroundColor: '#373432',
                    borderColor: '#3a3835'
                  }}
                  rows={1}
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