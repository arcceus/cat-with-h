"use client";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import Canvas from "../canvas/page";
import { useChatStore } from "@/app/store/chatStore";
import { Plus } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import ChatPage from "../chat/page";
import { useState, useRef, useCallback, useEffect } from 'react'
import ChatInputArea from '../chat/ChatInputArea'
import { useChat } from '@ai-sdk/react'
import type { Message } from '../types'
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function FloatingControls({ handleNewChat }: { handleNewChat: () => void }) {
  const { state } = useSidebar();
  return (
    <div className="fixed top-3 left-1 z-50 flex items-center min-h-8 px-2 gap-2 bg-sidebar rounded-lg shadow-lg">
      <SidebarTrigger />
      <ThemeToggle />
      {state === "collapsed" && (
        <button
          onClick={handleNewChat}
          className="flex items-center justify-center w-7 h-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function Workspace() {
  const { addChat, chats, canvasEnabled, setCanvasEnabled, chatEnabled, setChatEnabled, flipLayout, setFlipLayout, webSearchEnabled, setWebSearchEnabled, activeChatId, updateChatMessages } = useChatStore();
  const [showScrollButton, setShowScrollButton] = useState(false)
  const inputAreaRef = useRef<HTMLDivElement>(null)

  // Selection mode state and key listener
  const [selectionMode, setSelectionMode] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'm') {
        setSelectionMode((prev) => !prev);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Chat logic lifted from ChatPage
  const userMessageRef = useRef<string>('')
  const [pendingUserMessage, setPendingUserMessage] = useState<string | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeChat = chats.find(chat => chat.chatId === activeChatId)

  const {
    append,
    status,
    messages: sdkMessages,
    setInput
  } = useChat({
    id: activeChatId || undefined,
    onFinish: (finalMessage: any) => {
      if (activeChatId && userMessageRef.current) {
        const newMessage: Message = {
          chatId: activeChatId,
          messageId: finalMessage.id,
          content: {
            user: userMessageRef.current,
            ai: finalMessage.content
          }
        }
        const updatedMessages = [...(activeChat?.messages || []), newMessage]
        updateChatMessages(activeChatId, updatedMessages)
        userMessageRef.current = ''
        setPendingUserMessage(undefined)
      }
    },
  })

  const onSend = useCallback((input: string) => {
    if (!input.trim()) return
    userMessageRef.current = input || ''
    setPendingUserMessage(input)
    append({ role: 'user', content: input })
  }, [append])

  // onSend and status will be passed to ChatPage and ChatInputArea
  // We'll need to lift up the useChat logic from ChatPage to here, or pass a callback down
  // For now, pass a dummy onSend and status, to be replaced in next step

  // Scroll to bottom logic
  const scrollToBottom = () => {
    const scrollContainer = document.querySelector('.messages-container')
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }

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
                <ResizablePanel key="chat" defaultSize={60} minSize={55} maxSize={70}>
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
                        selectionMode={selectionMode}
                      />
                    </div>
                  </div>
                </ResizablePanel>
              ),
              canvasEnabled && (
                <>
                  <ResizableHandle key="handle" />
                  <ResizablePanel key="canvas" defaultSize={40} minSize={20}>
                    <div className="h-full w-full">
                      <div className="h-full w-full overflow-hidden">
                        <Canvas />
                      </div>
                    </div>
                  </ResizablePanel>
                </>
              )
            ] : [
              canvasEnabled && (
                <ResizablePanel key="canvas" defaultSize={40} minSize={20}>
                  <div className="h-full w-full">
                    <div className="h-full w-full overflow-hidden">
                      <Canvas />
                    </div>
                  </div>
                </ResizablePanel>
              ),
              chatEnabled && (
                <>
                  <ResizableHandle key="handle" />
                  <ResizablePanel key="chat" defaultSize={60} minSize={55} maxSize={70}>
                    <div className="h-full w-full">
                      <div className="h-full w-full rounded-xl overflow-hidden">
                        <ChatPage
                          canvasEnabled={canvasEnabled}
                          setCanvasEnabled={setCanvasEnabled}
                          chatEnabled={chatEnabled}
                          setChatEnabled={setChatEnabled}
                          flipLayout={flipLayout}
                          setFlipLayout={setFlipLayout} status={""} pendingUserMessage={undefined} sdkMessages={[]} setPendingUserMessage={function (v: string | undefined): void {
                            throw new Error("Function not implemented.");
                          } }
                          selectionMode={selectionMode}
                        />
                      </div>
                    </div>
                  </ResizablePanel>
                </>
              )
            ])}
          </ResizablePanelGroup>
        </SidebarInset>
        {/* Input bar always visible */}
        <ChatInputArea
          onSend={onSend}
          status={status}
          webSearchEnabled={webSearchEnabled}
          setWebSearchEnabled={setWebSearchEnabled}
          showScrollButton={showScrollButton}
          scrollToBottom={scrollToBottom}
          inputAreaRef={inputAreaRef}
          canvasEnabled={canvasEnabled}
          setCanvasEnabled={setCanvasEnabled}
          chatEnabled={chatEnabled}
          setChatEnabled={setChatEnabled}
          flipLayout={flipLayout}
          setFlipLayout={setFlipLayout}
        />
      </SidebarProvider>
    </DndProvider>
  );
}