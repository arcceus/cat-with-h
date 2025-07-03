"use client";
import React, { useState, useRef, useEffect } from 'react';
import ChatPanel from '../components/ChatPanel';
import CanvasPanel from '../components/CanvasPanel';
import { useTheme } from '../hooks/useTheme';

function App() {
  const [draggedText, setDraggedText] = useState<string | null>(null);
  const [sourceMsgId, setSourceMsgId] = useState<string | null>(null);
  const [sourceChatId, setSourceChatId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState('project-discussion');
  const [theme, setTheme] = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCanvasVisible, setIsCanvasVisible] = useState(true);
  const [leftPanelRatio, setLeftPanelRatio] = useState(50); // Percentage - no localStorage
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleTextDrag = (text: string, messageId: string, chatId: string) => {
    setDraggedText(text);
    setSourceMsgId(messageId);
    setSourceChatId(chatId);
  };

  const handleTextDragComplete = () => {
    setDraggedText(null);
    setSourceMsgId(null);
    setSourceChatId(null);
  };

  const handleBlockClick = (messageId: string, chatId?: string) => {
    if (chatId && chatId !== currentChatId) {
      setCurrentChatId(chatId);
    }
    setHighlightedMessageId(messageId);
  };

  const handleHighlightComplete = () => {
    setHighlightedMessageId(null);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleNewChat = () => {
    const newChatId = `new-chat-${Date.now()}`;
    setCurrentChatId(newChatId);
    setHighlightedMessageId(null);
    setDraggedText(null);
    setSourceMsgId(null);
    setSourceChatId(null);
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    setHighlightedMessageId(null);
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Constrain to reasonable bounds (20% - 80%)
    const constrainedRatio = Math.max(20, Math.min(80, newRatio));
    setLeftPanelRatio(constrainedRatio);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="h-screen w-screen flex overflow-hidden"
      style={{ backgroundColor: '#272725' }}
    >
      {/* Left Panel - Chat */}
      <div 
        className={isCanvasVisible ? 'border-r' : 'flex-[2]'}
        style={{ 
          borderColor: '#3a3835',
          flexBasis: isCanvasVisible ? `${leftPanelRatio}%` : '100%',
          flexGrow: isCanvasVisible ? 0 : 1,
          flexShrink: 0
        }}
      >
        <ChatPanel 
          theme={theme}
          currentChatId={currentChatId}
          onTextDrag={handleTextDrag}
          highlightedMessageId={highlightedMessageId}
          onHighlightComplete={handleHighlightComplete}
          onNewChat={handleNewChat}
          onThemeToggle={handleThemeToggle}
          onChatSelect={handleChatSelect}
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={handleSidebarToggle}
          onCanvasToggle={() => setIsCanvasVisible(v => !v)}
        />
      </div>
      
      {/* Resizable Divider */}
      {isCanvasVisible && (
        <div
          className="w-1 cursor-col-resize flex items-center justify-center transition-colors duration-200 hover:bg-blue-400"
          style={{ backgroundColor: isDragging ? '#3B82F6' : '#4B5563' }}
          onMouseDown={handleMouseDown}
        >
          <div className="p-1 rounded hover:bg-white/20 transition-colors">
            <div className="w-3 h-3 flex flex-col gap-0.5">
              <div className="w-full h-0.5 bg-gray-300 rounded"></div>
              <div className="w-full h-0.5 bg-gray-300 rounded"></div>
              <div className="w-full h-0.5 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Right Panel - Canvas */}
      {isCanvasVisible && (
        <div 
          className="min-w-0"
          style={{ 
            flexBasis: `${100 - leftPanelRatio}%`,
            flexGrow: 0,
            flexShrink: 0
          }}
        >
          <CanvasPanel 
            draggedText={draggedText}
            sourceMsgId={sourceMsgId}
            sourceChatId={sourceChatId}
            theme={theme}
            onTextDragComplete={handleTextDragComplete}
            onBlockClick={handleBlockClick}
          />
        </div>
      )}
    </div>
  );
}

export default App;