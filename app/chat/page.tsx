"use client"

import { useChatStore } from '../store/chatStore'
import { 
  Bot
} from 'lucide-react'
import { useRef, useEffect, useLayoutEffect } from 'react'
import type { Message } from '../types'
import React, { useCallback } from 'react'
import ChatMessage from './ChatMessage'
import { useState } from 'react'

// Convert from your Message type to SDK/UI message type
function toSdkMessages(messages: Message[]) {
  return messages.map(msg => ({
    id: String(msg.messageId),
    role: (msg.content.ai ? 'assistant' : 'user') as 'assistant' | 'user',
    content: msg.content.ai || msg.content.user
  }))
}

// Convert from SDK/UI message type to your Message type
function fromSdkMessages(sdkMessages: any[], chatId: string): Message[] {
  return sdkMessages.map((msg: any) => ({
    chatId,
    messageId: msg.id,
    content: msg.role === 'assistant'
      ? { user: '', ai: msg.content }
      : { user: msg.content }
  }))
}

export default function ChatPage({
  status,
  pendingUserMessage,
  sdkMessages,
  setPendingUserMessage,
  selectionMode: selectionModeProp = false
}: {
  canvasEnabled: boolean,
  setCanvasEnabled: (v: boolean) => void,
  chatEnabled: boolean,
  setChatEnabled: (v: boolean) => void,
  flipLayout: boolean,
  setFlipLayout: (v: boolean) => void,
  status: string,
  pendingUserMessage: string | undefined,
  sdkMessages: any[],
  setPendingUserMessage: (v: string | undefined) => void,
  selectionMode?: boolean
}) {
  const { activeChatId, chats, setActiveChat } = useChatStore()
  const [selectionMode, setSelectionMode] = useState(selectionModeProp)
  // const [selectedModel, setSelectedModel] = useState(AI_MODELS[0])
  // const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const userMessageRef = useRef<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeChat = chats.find(chat => chat.chatId === activeChatId)

  // Flatten messages for rendering
  const flatMessages = (activeChat?.messages || []).flatMap(msg => [
    { id: msg.messageId + '-user', role: 'user', content: msg.content.user },
    msg.content.ai
      ? { id: msg.messageId + '-ai', role: 'assistant', content: msg.content.ai }
      : undefined
  ]).filter((m): m is { id: string; role: 'user' | 'assistant'; content: string } => Boolean(m))

  // Add pending user message to the UI
  if (pendingUserMessage) {
    flatMessages.push({ id: 'pending-user', role: 'user', content: pendingUserMessage })
  }

  // If streaming, show the current AI response
  if (status === 'streaming' && sdkMessages.length > 0) {
    const lastMessage = sdkMessages[sdkMessages.length - 1]
    if (lastMessage.role === 'assistant') {
      flatMessages.push({ id: 'pending-ai', role: 'assistant', content: lastMessage.content })
    }
  }

  // Only scroll when user sends a message - no auto-scrolling during streaming
  useEffect(() => {
    if (pendingUserMessage) {
      // When user sends a message, scroll to show their message at the top with some context
      const userMessageElement = document.querySelector('[data-message-id="pending-user"]')
      if (userMessageElement) {
        // Scroll to show the user message with some space above it
        userMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Add a small delay to ensure the scroll completes before any AI response starts
        setTimeout(() => {
          const scrollContainer = document.querySelector('.messages-container')
          if (scrollContainer) {
            scrollContainer.scrollTop += 20 // Add a bit more space above
          }
        }, 100)
      }
    }
  }, [pendingUserMessage])

  // Check if scroll button should be shown
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.messages-container')
      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        // setShowScrollButton(!isNearBottom) // This state is removed
      }
    }
    
    const scrollContainer = document.querySelector('.messages-container')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Listen for scroll-to-chat-message event
  useEffect(() => {
    function handler(e: any) {
      const { chatId, messageId } = e.detail;
      if (chatId && setActiveChat) setActiveChat(chatId);
      setTimeout(() => {
        const el = document.querySelector(`[data-message-id='${messageId}']`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200); // Adjust delay as needed
    }
    window.addEventListener('scroll-to-chat-message', handler);
    return () => window.removeEventListener('scroll-to-chat-message', handler);
  }, [setActiveChat]);

  // Dynamically measure input area height
  useLayoutEffect(() => {
    // function updateInputHeight() { // This function is removed
    //   if (inputAreaRef.current) {
    //     setInputHeight(inputAreaRef.current.offsetHeight)
    //   }
    // }
    // updateInputHeight()
    // window.addEventListener('resize', updateInputHeight)
    // return () => window.removeEventListener('resize', updateInputHeight)
  }, [])

  const scrollToBottom = () => {
    console.log('Scroll to bottom called')
    const scrollContainer = document.querySelector('.messages-container')
    if (scrollContainer) {
      console.log('Scroll container found, scrolling to bottom')
      // Simple and reliable scroll to bottom
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    } else {
      console.log('Scroll container not found')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const memoizedCopyToClipboard = useCallback(copyToClipboard, [])

  // Handler to toggle selection mode
  const handleToggleSelectionMode = () => setSelectionMode((prev) => !prev)

  // Handler to regenerate the AI message for a given user message
  const handleRegenerate = (aiMessageId?: string) => {
    if (!activeChat || !activeChatId) return;
    // Find the AI message by messageId
    const aiMsgIndex = (activeChat.messages || []).findIndex(m => m.messageId + '-ai' === aiMessageId);
    if (aiMsgIndex === -1) return;
    const userMsg = activeChat.messages[aiMsgIndex];
    if (userMsg && userMsg.content.user) {
      // Remove the old AI response
      const updatedMessages = [...activeChat.messages];
      updatedMessages[aiMsgIndex] = {
        ...userMsg,
        content: { ...userMsg.content, ai: '' }
      };
      // Update the chat messages in Zustand
      useChatStore.getState().updateChatMessages(activeChatId, updatedMessages);
      // Trigger regeneration by setting pendingUserMessage
      setPendingUserMessage(userMsg.content.user);
    }
  }

  if (!activeChatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium">No chat selected</h3>
          <p className="text-sm text-muted-foreground">Select a chat from the sidebar to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area - takes remaining space, scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar messages-container streaming-scroll min-h-0">
        {flatMessages.length === 0 ? (
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
              How can I help you?
            </h1>
            <p className="text-lg text-muted-foreground font-light">
              I'm here to assist with your questions and tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {flatMessages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                status={status} 
                copyToClipboard={memoizedCopyToClipboard} 
                data-message-id={message.id}
                selectionMode={selectionMode}
                chatId={activeChatId}
                messageId={message.id}
                onToggleSelectionMode={handleToggleSelectionMode}
                onRegenerate={() => handleRegenerate(message.id)}
              />
            ))}
            {/* Empty space at bottom for better UX */}
            <div className="h-48" />
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {/* Remove ChatInputArea here */}
    </div>
  )
}