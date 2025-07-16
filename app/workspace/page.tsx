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
  const { addChat, chats } = useChatStore();

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
          <ResizablePanel defaultSize={60} minSize={15} maxSize={70}>
            <div className="h-full w-full">
              <div className="h-full w-full rounded-xl overflow-hidden">
                <ChatPage/>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full w-full">
              <div className="h-full w-full overflow-hidden">
                <Canvas />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarInset>
    </SidebarProvider>
  );
}