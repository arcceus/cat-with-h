"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  MoreVertical,
  Trash2,
  Edit2,
  Plus,
  Pin,
  PinOff,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useChatStore } from '@/store/chatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import type { Chat } from '@/app/types';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import CanvasDropdown from "@/app/_canvas/CanvasDropdown"

const data = {
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { chats, activeChatId, addChat, setActiveChat, deleteChat, renameChat, pinned, pinChat, unpinChat, search, setSearch } = useChatStore();
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Grouping helpers
  const now = new Date();
  const isToday = (date: Date) => date.toDateString() === now.toDateString();
  const isLast7Days = (date: Date) => {
    const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7 && !isToday(date);
  };
  const isLast30Days = (date: Date) => {
    const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 30 && !isToday(date) && !isLast7Days(date);
  };
  const isOlder = (date: Date) => (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) >= 30;

  // Pin logic
  const handlePin = (chatId: string) => pinned[chatId] ? unpinChat(chatId) : pinChat(chatId);

  // Filter and sort chats
  const filteredChats = chats.filter(chat => chat.title.toLowerCase().includes(search.toLowerCase()));
  const pinnedChats = filteredChats.filter(chat => pinned[chat.chatId]);
  const unpinnedChats = filteredChats.filter(chat => !pinned[chat.chatId]);

  // Group unpinned chats
  const groupChats = (chats: Chat[]) => {
    const groups: Record<string, Chat[]> = { Today: [], 'Last 7 days': [], 'Last 30 days': [], Older: [] };
    chats.forEach(chat => {
      const date = new Date(chat.updatedAt);
      if (isToday(date)) groups['Today'].push(chat);
      else if (isLast7Days(date)) groups['Last 7 days'].push(chat);
      else if (isLast30Days(date)) groups['Last 30 days'].push(chat);
      else groups['Older'].push(chat);
    });
    return groups;
  };
  const grouped = groupChats(unpinnedChats);

  const handleNewChat = () => {
    const newChat: Chat = {
      chatId: `chat_${Date.now()}`,
      title: `New Chat ${chats.length + 1}`,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    addChat(newChat);
    setActiveChat(newChat.chatId); // Ensure new chat is set as active
  };

  const handleRename = (chatId: string) => {
    if (renameValue.trim()) {
      renameChat(chatId, renameValue.trim());
      setRenameId(null);
      setRenameValue('');
    }
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex">
          <div className="pt-6"/>
        </div>
        <div className="flex flex-col gap-3 mt-2 w-56 mx-auto">
          
          <Button
            onClick={handleNewChat}
            className="w-full justify-start rounded-lg bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 h-8 text-sm gap-2"
            variant="default"
          >
            <Plus className="h-4 w-4" /> New Chat
          </Button>
          <CanvasDropdown />
          <Input
            className="w-full h-8 rounded-lg border border-muted-foreground/20 bg-muted px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition"
            placeholder="Search chats..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Separator className="my-1 w-[90%] mx-auto" />
        </div>
        {/* Chat List */}
        <div className="mt-2 flex flex-col gap-1 overflow-y-auto w-56 mx-auto">
          {/* Pinned Chats */}
          {pinnedChats.length > 0 && (
            <>
              <div className="text-xs text-muted-foreground font-semibold px-1 pt-2 pb-1">Pinned</div>
              {pinnedChats.map(chat => (
                <ContextMenu key={chat.chatId}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={`group flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer transition-colors text-xs min-h-[35px] ${activeChatId === chat.chatId ? 'bg-primary/10 text-primary' : 'hover:bg-muted/70'}`}
                      onClick={() => setActiveChat(chat.chatId)}
                    >
                      {renameId === chat.chatId ? (
                        <Input
                          className="h-7 text-xs"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          autoFocus
                          onBlur={() => handleRename(chat.chatId)}
                          onKeyDown={e => e.key === 'Enter' && handleRename(chat.chatId)}
                        />
                      ) : (
                        <span
                          className="truncate w-full block text-sm font-normal"
                          onDoubleClick={() => {
                            setRenameId(chat.chatId);
                            setRenameValue(chat.title);
                          }}
                        >
                          {chat.title}
                        </span>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handlePin(chat.chatId)}>
                      {pinned[chat.chatId] ? <><PinOff className="mr-2 h-3 w-3" /> Unpin</> : <><Pin className="mr-2 h-3 w-3" /> Pin</>}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => deleteChat(chat.chatId)} className="text-red-600">
                      <Trash2 className="mr-2 h-3 w-3" /> Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </>
          )}
          {/* Grouped Chats */}
          {Object.entries(grouped).map(([group, groupChats]) =>
            groupChats.length > 0 && (
              <React.Fragment key={group}>
                <div className="text-xs text-muted-foreground font-semibold px-1 pt-2 pb-1">{group}</div>
                {groupChats.map(chat => (
                  <ContextMenu key={chat.chatId}>
                    <ContextMenuTrigger asChild>
                      <div
                        className={`flex items-center justify-between rounded-lg px-2 py-1 cursor-pointer transition-colors text-xs min-h-[35px] ${activeChatId === chat.chatId ? 'bg-primary/10 text-primary' : 'hover:bg-muted/70'}`}
                        onClick={() => setActiveChat(chat.chatId)}
                      >
                        {renameId === chat.chatId ? (
                          <Input
                            className="h-7 text-xs"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            autoFocus
                            onBlur={() => handleRename(chat.chatId)}
                            onKeyDown={e => e.key === 'Enter' && handleRename(chat.chatId)}
                          />
                        ) : (
                          <span
                            className="truncate w-full block text-sm font-normal"
                            onDoubleClick={() => {
                              setRenameId(chat.chatId);
                              setRenameValue(chat.title);
                            }}
                          >
                            {chat.title}
                          </span>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handlePin(chat.chatId)}>
                        {pinned[chat.chatId] ? <><PinOff className="mr-2 h-3 w-3" /> Unpin</> : <><Pin className="mr-2 h-3 w-3" /> Pin</>}
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => deleteChat(chat.chatId)} className="text-red-600">
                        <Trash2 className="mr-2 h-3 w-3" /> Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </React.Fragment>
            )
          )}
        </div>
      </SidebarHeader>
      <SidebarFooter className="mt-auto flex items-end w-56 mx-auto">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
