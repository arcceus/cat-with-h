import { useChat } from '@ai-sdk/react';
import { useChatStore } from '@/store/chatStore';
import { useRef, useState, useEffect } from 'react';
import type { Message } from '../app/types';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useChatTitleAI } from './useChatTitleAI';

export function useWorkspaceChat(activeChatId: string | undefined) {
  const { updateChatMessages, chats, guestMessageCount, incrementGuestMessageCount, canGuestSendMessage, renameChat } = useChatStore();
  const userMessageRef = useRef<string>('');
  const [pendingUserMessage, setPendingUserMessage] = useState<string | undefined>(undefined);
  const [customApiKey, setCustomApiKey] = useState<string | null>(null);
  const { isSignedIn } = useUser();
  const { generateChatTitle } = useChatTitleAI();

  // Load custom API key from localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('custom-gemini-api-key');
    setCustomApiKey(storedKey);
  }, []);

  const activeChat = chats.find(chat => chat.chatId === activeChatId);

  const {
    append,
    status,
    messages: sdkMessages,
    setInput
  } = useChat({
    id: activeChatId || undefined,
    api: '/api/ai/stream',
    body: {
      chatId: activeChatId,
      customApiKey: customApiKey || undefined,
    },
    onFinish: async (finalMessage: any) => {
      if (activeChatId && userMessageRef.current) {
        const userMessage = userMessageRef.current; // Store before clearing
        const newMessage: Message = {
          chatId: activeChatId,
          messageId: finalMessage.id,
          content: {
            user: userMessage,
            ai: finalMessage.content
          }
        }
        const updatedMessages = [...(activeChat?.messages || []), newMessage]
        updateChatMessages(activeChatId, updatedMessages)
        
        // Clear refs after storing
        userMessageRef.current = ''
        setPendingUserMessage(undefined)
        
        // AI title generation: only if this is the first message and title is default
        // Use fresh chat state after update
        setTimeout(async () => {
          const freshChat = useChatStore.getState().chats.find(c => c.chatId === activeChatId);
          if (freshChat && freshChat.title.startsWith('New Chat') && freshChat.messages.length === 1) {
            console.log('🎯 Triggering AI title generation with:', { userMessage, aiResponse: finalMessage.content });
            const aiTitle = await generateChatTitle(userMessage, finalMessage.content)
            if (aiTitle) {
              console.log('✅ Setting new chat title:', aiTitle);
              renameChat(activeChatId, aiTitle)
            }
          }
        }, 0);
      }
    },
  });

  const onSend = (input: string) => {
    if (!input.trim()) return;
    if (!isSignedIn) {
      if (!canGuestSendMessage()) {
        toast.error('Please log in to continue chatting. You have reached the free message limit.');
        return;
      }
      incrementGuestMessageCount();
    }
    userMessageRef.current = input || '';
    setPendingUserMessage(input);
    append({ role: 'user', content: input });
  };

  return {
    onSend,
    status,
    sdkMessages,
    pendingUserMessage,
    setPendingUserMessage,
    userMessageRef,
    setInput,
  };
} 