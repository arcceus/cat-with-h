import { create } from "zustand";
import type { Chat } from "@/app/types";

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  addChat: (chat: Chat) => void;
  setActiveChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats], activeChatId: chat.chatId })),
  setActiveChat: (chatId) => set({ activeChatId: chatId }),
  deleteChat: (chatId) => set((state) => {
    const filtered = state.chats.filter((chat) => chat.chatId !== chatId);
    const isActiveDeleted = state.activeChatId === chatId;
    return {
      chats: filtered,
      activeChatId: isActiveDeleted ? null : state.activeChatId,
    };
  }),
  renameChat: (chatId, newTitle) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat.chatId === chatId ? { ...chat, title: newTitle } : chat
    ),
  })),
})); 