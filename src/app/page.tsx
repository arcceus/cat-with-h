"use client";
import React, { useState, useEffect, useRef } from 'react';
import ChatPanel from '../components/ChatPanel';
import CanvasPanel from '../components/CanvasPanel';
import ResizableDivider from '../components/ResizableDivider';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTheme } from '../hooks/useTheme';

function App() {
  const [draggedText, setDraggedText] = useState<string | null>(null);
  const [sourceMsgId, setSourceMsgId] = useState<string | null>(null);
  const [sourceChatId, setSourceChatId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [leftPanelWidth, setLeftPanelWidth] = useLocalStorage('leftPanelWidth', 500);
  const [currentChatId, setCurrentChatId] = useState('project-discussion');
  const [theme, setTheme] = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const minLeftWidth = 400;
  const minRightWidth = 450;

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ensure panel width constraints are respected
  useEffect(() => {
    const maxLeftWidth = containerWidth - minRightWidth;
    if (leftPanelWidth > maxLeftWidth) {
      setLeftPanelWidth(maxLeftWidth);
    } else if (leftPanelWidth < minLeftWidth) {
      setLeftPanelWidth(minLeftWidth);
    }
  }, [containerWidth, leftPanelWidth, setLeftPanelWidth]);

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
    // Switch to the correct chat if needed
    if (chatId && chatId !== currentChatId) {
      setCurrentChatId(chatId);
    }
    setHighlightedMessageId(messageId);
  };

  const handleHighlightComplete = () => {
    setHighlightedMessageId(null);
  };

  const handlePanelResize = (newLeftWidth: number) => {
    setLeftPanelWidth(newLeftWidth);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleNewChat = () => {
    // Create a new chat session
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

  const rightPanelWidth = containerWidth - leftPanelWidth - 1; // -1 for divider

  return (
    <div 
      ref={containerRef}
      className="h-screen w-screen flex overflow-hidden"
      style={{ backgroundColor: '#272725' }}
    >
      {/* Left Panel - Chat */}
      <div 
        className="flex-shrink-0 border-r"
        style={{ 
          width: leftPanelWidth,
          borderColor: '#3a3835'
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
        />
      </div>
      
      {/* Resizable Divider */}
      <ResizableDivider
        onResize={handlePanelResize}
        initialLeftWidth={leftPanelWidth}
        minLeftWidth={minLeftWidth}
        minRightWidth={minRightWidth}
        containerWidth={containerWidth}
      />
      
      {/* Right Panel - Canvas */}
      <div 
        className="flex-1 min-w-0"
        style={{ width: rightPanelWidth }}
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
    </div>
  );
}

export default App;