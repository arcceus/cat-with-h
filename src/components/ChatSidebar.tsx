import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, MessageSquare, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../lib/utils';

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

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentChatId: string;
  chatSessions: ChatSession[];
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onChatDelete?: (chatId: string) => void;
  onChatUpdate?: (chatId: string, updates: Partial<ChatSession>) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onToggle,
  currentChatId,
  chatSessions,
  onChatSelect,
  onNewChat,
  onChatDelete,
  onChatUpdate,
  onCollapsedChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Filter chats based on search query
  const filteredChats = chatSessions.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Sort chats by last activity
  const sortedChats = [...filteredChats].sort((a, b) => 
    b.lastActivity.getTime() - a.lastActivity.getTime()
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        onToggle();
      }
      
      // Ctrl/Cmd + Shift + N for new chat
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'N') {
        event.preventDefault();
        onNewChat();
      }
      
      // Ctrl/Cmd + F to focus search when sidebar is open
      if ((event.ctrlKey || event.metaKey) && event.key === 'f' && isOpen) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Arrow keys for chat navigation when sidebar is focused
      if (isOpen && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        const currentIndex = sortedChats.findIndex(chat => chat.id === currentChatId);
        if (currentIndex !== -1) {
          event.preventDefault();
          const nextIndex = event.key === 'ArrowUp' 
            ? Math.max(0, currentIndex - 1)
            : Math.min(sortedChats.length - 1, currentIndex + 1);
          
          if (sortedChats[nextIndex]) {
            onChatSelect(sortedChats[nextIndex].id);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentChatId, sortedChats, onToggle, onNewChat, onChatSelect]);

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
    // Clear unread count when selecting chat
    if (onChatUpdate) {
      const chat = chatSessions.find(c => c.id === chatId);
      if (chat?.unreadCount) {
        onChatUpdate(chatId, { unreadCount: 0 });
      }
    }
  };

  const handleDeleteChat = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onChatDelete && chatSessions.length > 1) {
      onChatDelete(chatId);
    }
  };

  const sidebarWidth = isCollapsed ? 80 : 270;

  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out flex flex-col bg-black/20 backdrop-blur-sm",
          isOpen ? "translate-x-0" : `-translate-x-full`
        )}
        style={{
          width: sidebarWidth
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" >
          {!isCollapsed && (
            <h1 className="text-white font-medium text-lg">Chatbot</h1>
          )}
          
          <div className="flex items-center">

            <Button
              onClick={onNewChat}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </Button>

            <Button
              onClick={() => {
                const newCollapsed = !isCollapsed;
                setIsCollapsed(newCollapsed);
                onCollapsedChange?.(newCollapsed);
              }}
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={onToggle}
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10 rounded-full ml-1"
              title="Close sidebar (Ctrl+B)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:bg-white/5"
                style={{
                  backgroundColor: '#373432'
                }}
              />
            </div>
          </div>
        )}

        {/* Chat List */}
        <ScrollArea className="flex-1 px-2">
          <div className="pb-4">
            {sortedChats.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 text-gray-500" />
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
                <p className="text-xs text-gray-500 mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSelect(chat.id)}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200",
                      currentChatId === chat.id
                        ? "bg-white/10"
                        : "hover:bg-white/5",
                      isCollapsed && "justify-center"
                    )}
                    title={isCollapsed ? chat.title : undefined}
                  >
                    {/* Chat Icon */}
                    <div className={cn(
                      "flex-shrink-0 w-2 h-2 rounded-full",
                      currentChatId === chat.id ? "bg-blue-400" : "bg-gray-600"
                    )} />
                    
                    {/* Chat Info */}
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={cn(
                            "font-normal truncate text-sm transition-colors",
                            currentChatId === chat.id ? "text-white" : "text-gray-300"
                          )}>
                            {chat.title}
                          </h4>
                          {/* Delete Button */}
                          {onChatDelete && chatSessions.length > 1 && (
                            <Button
                              onClick={(e) => handleDeleteChat(chat.id, e)}
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with shortcuts */}
        
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Toggle Button (when sidebar is closed) */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          className="fixed top-4 left-4 z-40 bg-blue-600 hover:bg-blue-700 text-white shadow-2xl rounded-full"
          size="icon"
          title="Open chat sidebar (Ctrl+B)"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}
    </>
  );
};

export default ChatSidebar;