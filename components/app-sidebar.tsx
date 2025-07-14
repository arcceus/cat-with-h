"use client";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Plus, MoreVertical } from "lucide-react";
import type { Chat } from "@/app/types";
import { useChatStore } from "@/app/store/chatStore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Mock chat data
const mockChats: Chat[] = [
  {
    chatId: "1",
    title: "Project Discussion",
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [],
  },
  {
    chatId: "2",
    title: "AI Support",
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [],
  },
  {
    chatId: "3",
    title: "Old Chat",
    updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [],
  },
  {
    chatId: "4",
    title: "Recent Chat",
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [],
  },
];

export function AppSidebar() {
  // Use Zustand global state
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const addChat = useChatStore((state) => state.addChat);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const deleteChat = useChatStore((state) => state.deleteChat);
  const renameChat = useChatStore((state) => state.renameChat);

  // On first mount, populate with mock data if empty
  React.useEffect(() => {
    if (chats.length === 0) {
      mockChats.forEach((chat) => addChat(chat));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group chats by date in render body
  const now = Date.now();
  const last7 = chats.filter(
    (chat) => (now - new Date(chat.updatedAt).getTime()) / (1000 * 60 * 60 * 24) <= 7
  );
  const last30 = chats.filter(
    (chat) =>
      (now - new Date(chat.updatedAt).getTime()) / (1000 * 60 * 60 * 24) > 7 &&
      (now - new Date(chat.updatedAt).getTime()) / (1000 * 60 * 60 * 24) <= 30
  );
  const older = chats.filter(
    (chat) => (now - new Date(chat.updatedAt).getTime()) / (1000 * 60 * 60 * 24) > 30
  );
  const groups = [
    { label: "Last 7 days", chats: last7 },
    { label: "Last 30 days", chats: last30 },
    { label: "Older", chats: older },
  ];

  function handleNewChat() {
    const newChat: Chat = {
      chatId: Date.now().toString(),
      title: `New Chat ${chats.length + 1}`,
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    addChat(newChat);
  }

  function handleSelectChat(chatId: string) {
    setActiveChat(chatId);
  }

  function handleDeleteChat(chatId: string) {
    deleteChat(chatId);
  }

  function handleRenameChat(chatId: string, currentTitle: string) {
    // For demo: use prompt. In real app, use a dialog/modal.
    const newTitle = window.prompt("Rename chat", currentTitle);
    if (newTitle && newTitle !== currentTitle) {
      renameChat(chatId, newTitle);
    }
  }

  return (
    <Sidebar variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={handleNewChat}>
              <Plus className="mr-2 size-4" />
              New Chat
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map(
          (group) =>
            group.chats.length > 0 && (
              <SidebarGroup key={group.label}>
                <div className="px-2 py-2 text-xs font-semibold text-muted-foreground">
                  {group.label}
                </div>
                <SidebarMenu>
                  {group.chats.map((chat) => (
                    <SidebarMenuItem key={chat.chatId}>
                      <SidebarMenuButton
                        isActive={chat.chatId === activeChatId}
                        onClick={() => handleSelectChat(chat.chatId)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <span className="truncate flex-1">{chat.title}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="ml-2 p-1 rounded hover:bg-accent"
                              onClick={e => e.stopPropagation()}
                              aria-label="More options"
                            >
                              <MoreVertical className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRenameChat(chat.chatId, chat.title)}>
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteChat(chat.chatId)} variant="destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )
        )}
      </SidebarContent>
    </Sidebar>
  );
}
