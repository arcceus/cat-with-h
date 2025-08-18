"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider
} from "@/components/ui/sidebar"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import Canvas from "../_canvas/page";
import { useChatStore } from "@/store/chatStore";
import ChatPage from "../_chat/ChatPage";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FloatingControls } from '@/components/FloatingControls';
import { useWorkspaceChat } from '@/hooks/useWorkspaceChat';

// FloatingControls moved to components/FloatingControls.tsx

export default function Workspace() {
  const { addChat, chats, canvasEnabled, setCanvasEnabled, chatEnabled, setChatEnabled, flipLayout, setFlipLayout, webSearchEnabled, setWebSearchEnabled, activeChatId } = useChatStore();
  const inputAreaRef = useRef<HTMLDivElement>(null)

  // Selection mode removed; selection is mapped to markdown automatically on drag

  const {
    onSend,
    status,
    sdkMessages,
    pendingUserMessage,
    setPendingUserMessage,
    userMessageRef,
    setInput,
  } = useWorkspaceChat(activeChatId || undefined);

  const handleNewChat = () => {
    const newChat = {
      chatId: `chat_${Date.now()}`,
      title: `New Chat ${chats.length + 1}`,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    addChat(newChat);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <SidebarProvider
        style={{
          "--sidebar-width": "16rem",
        } as React.CSSProperties}
        className="h-screen"
      >
        <FloatingControls handleNewChat={handleNewChat} />
        <AppSidebar />
        <SidebarInset>
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            {(!flipLayout ? [
              chatEnabled && (
                <ResizablePanel key="chat" defaultSize={55} minSize={55} maxSize={70}>
                  <div className="h-full w-full">
                    <div className="h-full w-full rounded-xl overflow-hidden">
                      <ChatPage
                        canvasEnabled={canvasEnabled}
                        setCanvasEnabled={setCanvasEnabled}
                        chatEnabled={chatEnabled}
                        setChatEnabled={setChatEnabled}
                        flipLayout={flipLayout}
                        setFlipLayout={setFlipLayout}
                        status={status}
                        pendingUserMessage={pendingUserMessage}
                        sdkMessages={sdkMessages}
                        setPendingUserMessage={setPendingUserMessage}
                        onSend={onSend}
                        webSearchEnabled={webSearchEnabled}
                        setWebSearchEnabled={setWebSearchEnabled}
                        inputAreaRef={inputAreaRef}
                      />
                    </div>
                  </div>
                </ResizablePanel>
              ),
              canvasEnabled && (
                <React.Fragment key="canvas-handle">
                  <ResizableHandle />
                  <ResizablePanel defaultSize={45} minSize={20}>
                    <div className="h-full w-full">
                      <div className="h-full w-full overflow-hidden">
                        <Canvas />
                      </div>
                    </div>
                  </ResizablePanel>
                </React.Fragment>
              )
            ] : [
              canvasEnabled && (
                <ResizablePanel key="canvas-flipped" defaultSize={45} minSize={20}>
                  <div className="h-full w-full">
                    <div className="h-full w-full overflow-hidden">
                      <Canvas />
                    </div>
                  </div>
                </ResizablePanel>
              ),
              chatEnabled && (
                <React.Fragment key="chat-handle">
                  <ResizableHandle />
                  <ResizablePanel defaultSize={55} minSize={55} maxSize={70}>
                    <div className="h-full w-full">
                      <div className="h-full w-full rounded-xl overflow-hidden">
                        <ChatPage
                          canvasEnabled={canvasEnabled}
                          setCanvasEnabled={setCanvasEnabled}
                          chatEnabled={chatEnabled}
                          setChatEnabled={setChatEnabled}
                          flipLayout={flipLayout}
                          setFlipLayout={setFlipLayout}
                          status={status}
                          pendingUserMessage={pendingUserMessage}
                          sdkMessages={sdkMessages}
                          setPendingUserMessage={setPendingUserMessage}
                          onSend={onSend}
                          webSearchEnabled={webSearchEnabled}
                          setWebSearchEnabled={setWebSearchEnabled}
                          inputAreaRef={inputAreaRef}
                        />
                      </div>
                    </div>
                  </ResizablePanel>
                </React.Fragment>
              )
            ]).filter(Boolean)}
          </ResizablePanelGroup>
        </SidebarInset>
      </SidebarProvider>
    </DndProvider>
  );
}