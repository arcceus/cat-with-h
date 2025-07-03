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
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onToggle,
  currentChatId,
  chatSessions,
  onChatSelect,
  onNewChat,
  onChatDelete,
  onChatUpdate
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

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const getLastMessage = (chat: ChatSession) => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (!lastMessage) return 'No messages yet';
    
    const content = lastMessage.content;
    const maxLength = isCollapsed ? 20 : 60;
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...'
      : content;
  };

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

  const sidebarWidth = isCollapsed ? 80 : 320;

  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out border-r flex flex-col",
          isOpen ? "translate-x-0" : `-translate-x-full`
        )}
        style={{
          width: sidebarWidth,
          backgroundColor: '#1d1b18',
          borderColor: '#3a3835'
        }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#3a3835' }}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              <h2 className="font-semibold text-white">Chats</h2>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={onToggle}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
              title="Close sidebar (Ctrl+B)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="p-4 border-b" style={{ borderColor: '#3a3835' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search conversations... (Ctrl+F)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{
                  backgroundColor: '#373432',
                  border: '1px solid #3a3835'
                }}
              />
            </div>
          </div>
        )}

        {/* New Chat Button */}
        <div className="p-4">
          <Button
            onClick={onNewChat}
            className={cn(
              "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200",
              isCollapsed ? "w-12 h-12 p-0 justify-center" : "w-full"
            )}
            title={isCollapsed ? "New Chat (Ctrl+Shift+N)" : undefined}
          >
            <Plus className="h-4 w-4" />
            {!isCollapsed && (
              <>
                <span>New Chat</span>
              </>
            )}
          </Button>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="px-2 pb-4">
            {sortedChats.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {searchQuery ? 'No chats found' : 'No conversations yet'}
              </div>
            ) : (
              <div className="space-y-1">
                {sortedChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSelect(chat.id)}
                    className={cn(
                      "group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                      currentChatId === chat.id
                        ? "bg-blue-600/20 border border-blue-500/30"
                        : "hover:bg-white/5",
                      isCollapsed && "justify-center"
                    )}
                    title={isCollapsed ? chat.title : undefined}
                  >
                    {/* Chat Icon */}
                    {/* <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative",
                        currentChatId === chat.id
                          ? "bg-blue-600"
                          : "bg-gray-600"
                      )}
                    >
                      <MessageSquare className="h-5 w-5 text-white" />
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </div> */}

                    {/* Chat Info */}
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={cn(
                            "font-medium truncate",
                            currentChatId === chat.id ? "text-blue-300" : "text-white"
                          )}>
                            {chat.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(chat.lastActivity)}
                            </span>
                            {currentChatId === chat.id && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-400 mt-1 truncate text-wrap">
                          {getLastMessage(chat)}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500">
                            {chat.messages.length} messages
                          </div>
                          
                          {/* Delete Button */}
                          {onChatDelete && chatSessions.length > 1 && (
                            <Button
                              onClick={(e) => handleDeleteChat(chat.id, e)}
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
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
        {!isCollapsed && (
          <div className="p-3 border-t text-xs text-gray-500" style={{ borderColor: '#3a3835' }}>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>⌘B Toggle</span>
                <span>↑↓ Navigate</span>
              </div>
              <div className="flex justify-between">
                <span>⌘F Search</span>
                <span>⌘⇧N New</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Toggle Button (when sidebar is closed) */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          className="fixed top-4 left-4 z-40 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="icon"
          title="Open chat sidebar (Ctrl+B)"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      )}
    </>
  );
};

export default ChatSidebar;