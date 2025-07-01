import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageSquare, Menu, Moon, Sun, Plus, Clock, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../lib/utils';
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
}

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
  onSidebarToggle
}) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: 'project-discussion',
      title: 'Project Discussion',
      lastActivity: new Date(Date.now() - 1000 * 60 * 30),
      messages: [
        {
          id: '1',
          type: 'user',
          content: 'I need help planning our upcoming product launch. We have several key components to coordinate including marketing, development, and customer support.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
        },
        {
          id: '2',
          type: 'ai',
          content: 'A successful product launch requires careful orchestration of multiple departments. Let me break down the essential components: First, your marketing team should develop a comprehensive campaign strategy that includes pre-launch buzz, launch day activities, and post-launch follow-up. This involves content creation, social media planning, press releases, and potentially influencer partnerships. The timeline should start at least 6-8 weeks before launch.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 30000)
        },
        {
          id: '3',
          type: 'user',
          content: 'That makes sense. What about the technical side? We want to ensure our infrastructure can handle the expected traffic surge.',
          timestamp: new Date(Date.now() - 1000 * 60 * 90)
        },
        {
          id: '4',
          type: 'ai',
          content: 'Infrastructure planning is crucial for launch success. Your development team should conduct thorough load testing to simulate expected traffic patterns. Consider implementing auto-scaling solutions, CDN optimization, and database performance tuning. Set up comprehensive monitoring and alerting systems to catch issues early. Have a rollback plan ready and ensure your team is prepared for rapid response to any technical challenges that arise during launch.',
          timestamp: new Date(Date.now() - 1000 * 60 * 85)
        },
        {
          id: '5',
          type: 'user',
          content: 'How should we coordinate between teams to ensure everyone is aligned on timing and responsibilities?',
          timestamp: new Date(Date.now() - 1000 * 60 * 30)
        }
      ]
    },
    {
      id: 'personal-notes',
      title: 'Personal Notes',
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 4),
      messages: [
        {
          id: '1',
          type: 'user',
          content: 'I want to develop better habits for personal productivity and work-life balance. I feel like I\'m constantly busy but not always making meaningful progress.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6)
        },
        {
          id: '2',
          type: 'ai',
          content: 'Achieving sustainable productivity while maintaining work-life balance requires intentional systems and boundaries. Start by conducting a time audit to understand where your energy actually goes versus where you think it goes. Many people discover they\'re spending significant time on low-impact activities. Focus on identifying your peak energy hours and protecting them for your most important work. This might mean blocking calendar time for deep work and being more selective about meetings.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6 + 45000)
        }
      ]
    },
    {
      id: 'team-brainstorm',
      title: 'Team Brainstorm',
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24),
      unreadCount: 2,
      messages: [
        {
          id: '1',
          type: 'user',
          content: 'Our team needs to innovate our approach to customer engagement. We\'re seeing declining engagement rates and need fresh ideas to reconnect with our audience.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26)
        },
        {
          id: '2',
          type: 'ai',
          content: 'Revitalizing customer engagement requires understanding the evolving expectations and preferences of your audience. Modern customers value authentic, personalized experiences over generic marketing messages.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26 + 30000)
        }
      ]
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentChat = chatSessions.find(chat => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

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
  }, [messages, currentChatId]);

  useEffect(() => {
    if (highlightedMessageId) {
      scrollToMessage(highlightedMessageId);
      
      const timer = setTimeout(() => {
        onHighlightComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [highlightedMessageId, scrollToMessage, onHighlightComplete]);

  const simulateAIResponse = (userMessage: string): string => {
    const responses = [
      `That's an interesting perspective on "${userMessage}". Let me elaborate on the key concepts and their interconnections. Understanding these relationships can help you see how different elements work together to create a comprehensive framework for success.`,
      `Your question about "${userMessage}" touches on several important areas that deserve careful consideration. Here's my analysis of the underlying principles and how they connect to broader themes in the field, along with practical applications you can implement.`,
      `Regarding "${userMessage}", there are multiple facets to consider that can significantly impact your approach. Let me break down the essential components and show you how they relate to each other in meaningful ways that drive results.`,
      `The topic of "${userMessage}" is quite complex and multifaceted, involving various interconnected elements. I can help you explore the relationships between different aspects and understand how they influence each other in both obvious and subtle ways.`,
      `Great question about "${userMessage}". This connects to broader themes and principles that are worth exploring in depth. Let me explain the key relationships and their implications for your specific situation and goals.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)] + 
           ` The interconnected nature of these concepts means that understanding one aspect helps illuminate others. Consider how the foundational principles relate to practical applications, and how different perspectives can reveal new insights and opportunities for deeper exploration and implementation.`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    // Update the current chat with the new message
    setChatSessions(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          messages: [...chat.messages, userMessage],
          lastActivity: new Date()
        };
      }
      return chat;
    }));

    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: simulateAIResponse(userMessage.content),
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
      
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
      />

      {/* Main Chat Content */}
      <div className={cn(
        "flex flex-col h-full transition-all duration-300",
        isSidebarOpen ? "lg:ml-80" : "ml-0"
      )}>
        {/* Top Navigation Bar */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ 
            backgroundColor: '#272725',
            borderColor: '#3a3835'
          }}
        >
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSidebarToggle}
                className="h-9 w-9 text-white hover:bg-white/10"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-semibold text-white truncate">
              {currentChat?.title || 'AI Chat'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onThemeToggle}
              className="h-9 w-9 text-white hover:bg-white/10"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-6 space-y-6 max-w-4xl mx-auto">
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
                  "flex gap-4",
                  message.type === 'user' ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 transition-all duration-300",
                    message.type === 'user'
                      ? "ml-12"
                      : "mr-12",
                    highlightedMessageId === message.id && "ring-2 ring-blue-400 ring-offset-2"
                  )}
                  style={{
                    backgroundColor: message.type === 'user' ? '#373432' : 'transparent',
                    color: '#ffffff'
                  }}>
                    <div 
                      className="text-sm leading-relaxed whitespace-pre-wrap cursor-text"
                      onMouseUp={() => handleMouseUp(message.id)}
                      style={{ userSelect: 'text' }}
                    >
                      {message.content}
                    </div>
                    <div className="text-xs mt-2 opacity-70 text-gray-300">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 mr-12" style={{ backgroundColor: 'transparent' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-sm text-gray-400 ml-2">
                      AI is thinking...
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
          className="border-t p-6"
          style={{ 
            backgroundColor: '#272725',
            borderColor: '#3a3835'
          }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="w-full resize-none rounded-2xl border px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 min-h-[44px] max-h-32 text-white"
                  style={{
                    backgroundColor: '#373432',
                    borderColor: '#3a3835'
                  }}
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Select text in messages to drag it to the canvas • Click canvas blocks to highlight source messages
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;