import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Chat } from "@/app/types";

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
  updateChatMessages: (chatId: string, messages: any[]) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      pinned: {},
      search: '',
      addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats], activeChatId: chat.chatId })),
      setActiveChat: (chatId) => set({ activeChatId: chatId }),
      deleteChat: (chatId) => set((state) => {
        const filtered = state.chats.filter((chat) => chat.chatId !== chatId);
        const isActiveDeleted = state.activeChatId === chatId;
        // Remove from pinned if present
        const { [chatId]: _, ...restPinned } = state.pinned;
        return {
          chats: filtered,
          activeChatId: isActiveDeleted ? null : state.activeChatId,
          pinned: restPinned,
        };
      }),
      renameChat: (chatId, newTitle) => set((state) => ({
        chats: state.chats.map((chat) =>
          chat.chatId === chatId ? { ...chat, title: newTitle } : chat
        ),
      })),
      pinChat: (chatId) => set((state) => ({ pinned: { ...state.pinned, [chatId]: true } })),
      unpinChat: (chatId) => set((state) => {
        const { [chatId]: _, ...rest } = state.pinned;
        return { pinned: rest };
      }),
      setSearch: (search) => set({ search }),
      updateChatMessages: (chatId, messages) => set((state) => ({
        chats: state.chats.map((chat) =>
          chat.chatId === chatId ? { ...chat, messages, updatedAt: new Date().toISOString() } : chat
        ),
      })),
    }),
    {
      name: 'chat-storage', // unique name for localStorage key
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        pinned: state.pinned,
        search: state.search,
      }),
    }
  )
); 