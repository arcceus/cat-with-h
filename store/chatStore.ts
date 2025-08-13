import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Message } from "@/app/types";
import { shapeDBToZustand } from '@/lib/utils';

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
  guestMessageCount: number; // Track messages for unauthenticated users
  addChat: (chat: Chat, notify?: (msg: string) => void) => Promise<void>;
  setActiveChat: (chatId: string) => void;
  deleteChat: (chatId: string, notify?: (msg: string) => void) => Promise<void>;
  renameChat: (chatId: string, newTitle: string, notify?: (msg: string) => void) => Promise<void>;
  pinChat: (chatId: string, notify?: (msg: string) => void) => Promise<void>;
  unpinChat: (chatId: string, notify?: (msg: string) => void) => Promise<void>;
  setSearch: (search: string) => void;
  updateChatMessages: (chatId: string, messages: Message[], notify?: (msg: string) => void) => Promise<void>;
  // Track messages for unauthenticated users
  incrementGuestMessageCount: () => void;
  resetGuestMessageCount: () => void;
  canGuestSendMessage: () => boolean;
  // Canvas settings
  canvasEnabled: boolean;
  setCanvasEnabled: (v: boolean) => void;
  chatEnabled: boolean;
  setChatEnabled: (v: boolean) => void;
  flipLayout: boolean;
  setFlipLayout: (v: boolean) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (v: boolean) => void;
  hydrateFromServer: (onError?: (msg: string) => void) => Promise<void>;
}

/**
 * Runs an optimistic update, calls an async API, and rolls back on error.
 * @param optimisticUpdate - function to update Zustand state optimistically
 * @param apiCall - async function to call the API
 * @param rollback - function to restore previous Zustand state
 * @param notify - function to show error notification
 */
async function runOptimisticUpdate<T>(
  optimisticUpdate: () => void,
  apiCall: () => Promise<T>,
  rollback: () => void,
  notify?: (msg: string) => void
) {
  optimisticUpdate();
  try {
    await apiCall();
  } catch (e: any) {
    rollback();
    if (notify) notify(e.message || "Something went wrong");
  }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      pinned: {},
      search: '',
      guestMessageCount: 0,
      canvasEnabled: true,
      setCanvasEnabled: (v: boolean) => set({ canvasEnabled: v }),
      chatEnabled: true,
      setChatEnabled: (v: boolean) => set({ chatEnabled: v }),
      flipLayout: false,
      setFlipLayout: (v: boolean) => set({ flipLayout: v }),
      webSearchEnabled: false,
      setWebSearchEnabled: (v: boolean) => set({ webSearchEnabled: v }),
      incrementGuestMessageCount: () => set((state) => ({ guestMessageCount: state.guestMessageCount + 1 })),
      resetGuestMessageCount: () => set({ guestMessageCount: 0 }),
      canGuestSendMessage: () => get().guestMessageCount < 5,
      addChat: async (chat, notify) => {
        const prevChats = get().chats;
        await runOptimisticUpdate(
          () => set((state) => ({ chats: [chat, ...state.chats], activeChatId: chat.chatId })),
          () => fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chat),
          }),
          () => set({ chats: prevChats }),
          notify
        );
      },
      setActiveChat: (chatId: string) => {
        console.log('[setActiveChat] chatId:', chatId);
        set({ activeChatId: chatId });
      },
      deleteChat: async (chatId, notify) => {
        const prevChats = get().chats;
        const prevPinned = get().pinned;
        const prevActiveChatId = get().activeChatId;
        await runOptimisticUpdate(
          () => set((state) => {
            const filtered = state.chats.filter((chat) => chat.chatId !== chatId);
            const isActiveDeleted = state.activeChatId === chatId;
            const { [chatId]: _, ...restPinned } = state.pinned;
            return {
              chats: filtered,
              activeChatId: isActiveDeleted ? null : state.activeChatId,
              pinned: restPinned,
            };
          }),
          () => fetch(`/api/chats/${chatId}`, { method: 'DELETE' }),
          () => set({ chats: prevChats, pinned: prevPinned, activeChatId: prevActiveChatId }),
          notify
        );
      },
      renameChat: async (chatId, newTitle, notify) => {
        const prevChats = get().chats;
        await runOptimisticUpdate(
          () => set((state) => ({
            chats: state.chats.map((chat) =>
              chat.chatId === chatId ? { ...chat, title: newTitle, updatedAt: new Date().toISOString() } : chat
            ),
          })),
          () => fetch(`/api/chats/${chatId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle }),
          }),
          () => set({ chats: prevChats }),
          notify
        );
      },
      pinChat: async (chatId, notify) => {
        const prevPinned = get().pinned;
        await runOptimisticUpdate(
          () => set((state) => ({ pinned: { ...state.pinned, [chatId]: true } })),
          () => fetch(`/api/chats/${chatId}/pin`, { method: 'POST' }),
          () => set({ pinned: prevPinned }),
          notify
        );
      },
      unpinChat: async (chatId, notify) => {
        const prevPinned = get().pinned;
        await runOptimisticUpdate(
          () => set((state) => {
            const { [chatId]: _, ...rest } = state.pinned;
            return { pinned: rest };
          }),
          () => fetch(`/api/chats/${chatId}/pin`, { method: 'DELETE' }),
          () => set({ pinned: prevPinned }),
          notify
        );
      },
      setSearch: (search: string) => {
        console.log('[setSearch] search:', search);
        set({ search });
      },
      updateChatMessages: async (chatId, messages, notify) => {
        const prevChats = get().chats;
        await runOptimisticUpdate(
          () => set((state) => ({
            chats: state.chats.map((chat) =>
              chat.chatId === chatId ? { ...chat, messages, updatedAt: new Date().toISOString() } : chat
            ),
          })),
          () => fetch(`/api/chats/${chatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
          }),
          () => set({ chats: prevChats }),
          notify
        );
      },
      hydrateFromServer: async (onError?: (msg: string) => void) => {
        try {
          console.log('🔄 Fetching chats from /api/chats...');
          const res = await fetch('/api/chats');
          if (!res.ok) throw new Error('Failed to fetch chats');
          const data = await res.json();
          console.log('📦 Raw data from API:', data);
          
          const shaped = shapeDBToZustand(data);
          console.log('🔄 Shaped data for Zustand:', shaped);
          
          set((state) => {
            const newState = {
              ...state,
              ...shaped,
            };
            console.log('💾 Setting new chat state:', {
              chatsCount: newState.chats.length,
              pinnedCount: Object.keys(newState.pinned).length
            });
            return newState;
          });
        } catch (e: any) {
          console.error('❌ Error in hydrateFromServer:', e);
          if (onError) onError(e.message || 'Failed to sync chats');
        }
      },
    }),
    {
      name: 'chat-storage', // unique name for localStorage key
      partialize: (state) => ({
        chats: state.chats,
        activeChatId: state.activeChatId,
        pinned: state.pinned,
        search: state.search,
        guestMessageCount: state.guestMessageCount,
        canvasEnabled: state.canvasEnabled,
        chatEnabled: state.chatEnabled,
        flipLayout: state.flipLayout,
        webSearchEnabled: state.webSearchEnabled,
      }),
    }
  )
); 