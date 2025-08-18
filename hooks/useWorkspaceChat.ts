import { useChat } from '@ai-sdk/react';
import { useChatStore, type AIModel } from '@/store/chatStore';
import { useRef, useState, useEffect } from 'react';
import type { Message } from '../app/types';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useChatTitleAI } from './useChatTitleAI';

export function useWorkspaceChat(activeChatId: string | undefined) {
  const { updateChatMessages, chats, guestMessageCount, incrementGuestMessageCount, canGuestSendMessage, renameChat, selectedModel } = useChatStore();
  const userMessageRef = useRef<string>('');
  const [pendingUserMessage, setPendingUserMessage] = useState<string | undefined>(undefined);
  const [customApiKey, setCustomApiKey] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { isSignedIn } = useUser();
  const { generateChatTitle } = useChatTitleAI();

  // Load custom API key and selected model from localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('custom-gemini-api-key');
    setCustomApiKey(storedKey);
    
    // Load selected model from localStorage if available
    const storedModel = localStorage.getItem('selected-ai-model');
    if (storedModel === 'gemini' || storedModel === 'ollama') {
      useChatStore.getState().setSelectedModel(storedModel);
    }
  }, []);

  // Determine API endpoint based on selected model
  const apiEndpoint = selectedModel === 'ollama' 
    ? '/api/ai/ollama/stream'
    : '/api/ai/stream';

  const activeChat = chats.find(chat => chat.chatId === activeChatId);

  const {
    append,
    status,
    messages: sdkMessages,
    setInput
  } = useChat({
    id: activeChatId || undefined,
    api: apiEndpoint,
    body: {
      chatId: activeChatId,
      customApiKey: selectedModel === 'gemini' ? (customApiKey || undefined) : undefined,
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
        setIsSubmitted(false) // Reset submitted state when finished
        
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

  // Create a composite status that includes our submitted state
  const compositeStatus = isSubmitted && (status === 'ready' || status === 'error') ? 'submitted' : status;

  // Reset submitted state when streaming starts
  useEffect(() => {
    if (status === 'streaming' && isSubmitted) {
      setIsSubmitted(false);
    }
  }, [status, isSubmitted]);

  const onSend = (input: string) => {
    if (!input.trim()) return;
    if (!isSignedIn) {
      if (!canGuestSendMessage()) {
        toast.error('Please log in to continue chatting. You have reached the free message limit.');
        return;
      }
      incrementGuestMessageCount();
    }
    // If this is the very first user message after creating a new chat,
    // update the chat title to the first user message immediately.
    if (activeChatId && activeChat) {
      const isDefaultTitle = activeChat.title?.startsWith('New Chat');
      const isFirstMessage = (activeChat.messages?.length || 0) === 0;
      if (isDefaultTitle && isFirstMessage) {
        // Use the first line, trimmed, capped at 80 chars
        const firstLine = (input.split('\n')[0] || '').trim();
        const newTitle = firstLine.length > 80 ? firstLine.slice(0, 77).trimEnd() + '…' : firstLine || 'New Chat';
        if (newTitle && newTitle !== activeChat.title) {
          renameChat(activeChatId, newTitle);
        }
      }
    }
    userMessageRef.current = input || '';
    setPendingUserMessage(input);
    setIsSubmitted(true); // Set submitted state immediately when user sends message
    append({ role: 'user', content: input });
  };

  return {
    onSend,
    status: compositeStatus,
    sdkMessages,
    pendingUserMessage,
    setPendingUserMessage,
    userMessageRef,
    setInput,
  };
} 