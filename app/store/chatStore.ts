import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Message } from "@/app/types";

interface Chat {
  chatId: string;
  messages: Message[];
  updatedAt: string;
  title: string;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  pinned: Record<string, boolean>;
  search: string;
  addChat: (chat: Chat) => void;
  setActiveChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  pinChat: (chatId: string) => void;
  unpinChat: (chatId: string) => void;
  setSearch: (search: string) => void;
  updateChatMessages: (chatId: string, messages: Message[]) => void;
  canvasEnabled: boolean;
  setCanvasEnabled: (v: boolean) => void;
  chatEnabled: boolean;
  setChatEnabled: (v: boolean) => void;
  flipLayout: boolean;
  setFlipLayout: (v: boolean) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (v: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      pinned: {},
      search: '',
      canvasEnabled: true,
      setCanvasEnabled: (v: boolean) => set({ canvasEnabled: v }),
      chatEnabled: true,
      setChatEnabled: (v: boolean) => set({ chatEnabled: v }),
      flipLayout: false,
      setFlipLayout: (v: boolean) => set({ flipLayout: v }),
      webSearchEnabled: false,
      setWebSearchEnabled: (v: boolean) => set({ webSearchEnabled: v }),
      addChat: (chat: Chat) => set((state) => {
        const newChats = [chat, ...state.chats];
        console.log('[addChat] chats:', newChats);
        return { chats: newChats, activeChatId: chat.chatId };
      }),
      setActiveChat: (chatId: string) => {
        console.log('[setActiveChat] chatId:', chatId);
        set({ activeChatId: chatId });
      },
      deleteChat: (chatId: string) => set((state) => {
        const filtered = state.chats.filter((chat) => chat.chatId !== chatId);
        const isActiveDeleted = state.activeChatId === chatId;
        // Remove from pinned if present
        const { [chatId]: _, ...restPinned } = state.pinned;
        console.log('[deleteChat] chats:', filtered);
        return {
          chats: filtered,
          activeChatId: isActiveDeleted ? null : state.activeChatId,
          pinned: restPinned,
        };
      }),
      renameChat: (chatId: string, newTitle: string) => set((state) => {
        const renamed = state.chats.map((chat) =>
          chat.chatId === chatId ? { ...chat, title: newTitle } : chat
        );
        console.log('[renameChat] chats:', renamed);
        return { chats: renamed };
      }),
      pinChat: (chatId: string) => set((state) => {
        console.log('[pinChat] chatId:', chatId);
        return { pinned: { ...state.pinned, [chatId]: true } };
      }),
      unpinChat: (chatId: string) => set((state) => {
        const { [chatId]: _, ...rest } = state.pinned;
        console.log('[unpinChat] chatId:', chatId);
        return { pinned: rest };
      }),
      setSearch: (search: string) => {
        console.log('[setSearch] search:', search);
        set({ search });
      },
      updateChatMessages: (chatId: string, messages: Message[]) => set((state) => {
        const updated = state.chats.map((chat) =>
          chat.chatId === chatId ? { ...chat, messages, updatedAt: new Date().toISOString() } : chat
        );
        console.log('[updateChatMessages] chatId:', chatId, 'messages:', messages);
        return { chats: updated };
      }),
    }),
    {
      name: 'chat-storage', // unique name for localStorage key
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        pinned: state.pinned,
        search: state.search,
        canvasEnabled: state.canvasEnabled,
        chatEnabled: state.chatEnabled,
        flipLayout: state.flipLayout,
        webSearchEnabled: state.webSearchEnabled,
      }),
    }
  )
); 