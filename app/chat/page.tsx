"use client"

import { useChat } from '@ai-sdk/react'
import { useChatStore } from '../store/chatStore'
import { 
  Bot,
  Sparkles,
  Zap,
  Brain
} from 'lucide-react'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import type { Message } from '../types'
import React, { useCallback } from 'react'
import ChatInputArea from './ChatInputArea'
import ChatMessage from './ChatMessage'

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

const AI_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', icon: Brain, description: 'Most capable model' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', icon: Zap, description: 'Fast and efficient' },
  { id: 'claude-3', name: 'Claude 3', icon: Sparkles, description: 'Anthropic\'s latest' },
]

export default function ChatPage() {
  const { activeChatId, chats, updateChatMessages } = useChatStore()
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0])
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const userMessageRef = useRef<string>('')
  const [pendingUserMessage, setPendingUserMessage] = useState<string | undefined>(undefined)
  const inputAreaRef = useRef<HTMLDivElement>(null)
  const [inputHeight, setInputHeight] = useState(120)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeChat = chats.find(chat => chat.chatId === activeChatId)

  const {
    append,
    status,
    messages: sdkMessages,
    setInput
  } = useChat({
    id: activeChatId || undefined,
    onFinish: (finalMessage: any) => {
      if (activeChatId && userMessageRef.current) {
        const newMessage: Message = {
          chatId: activeChatId,
          messageId: finalMessage.id,
          content: {
            user: userMessageRef.current,
            ai: finalMessage.content
          }
        }
        const updatedMessages = [...(activeChat?.messages || []), newMessage]
        updateChatMessages(activeChatId, updatedMessages)
        userMessageRef.current = ''
        setPendingUserMessage(undefined)
      }
    },
  })

  // Memoized onSend handler for ChatInputArea
  const onSend = useCallback((input: string) => {
    if (!input.trim()) return
    userMessageRef.current = input || ''
    setPendingUserMessage(input)
    append({ role: 'user', content: input })
  }, [append])



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

  // Auto-scroll to bottom when new messages arrive
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
    } else if (status === 'streaming' && sdkMessages.length > 0) {
      // When AI starts streaming, scroll to show the streaming response
      const lastMessage = sdkMessages[sdkMessages.length - 1]
      if (lastMessage.role === 'assistant') {
        const aiMessageElement = document.querySelector('[data-message-id="pending-ai"]')
        if (aiMessageElement) {
          aiMessageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }
    } else {
      // When AI finishes responding, scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [flatMessages, pendingUserMessage, status, sdkMessages])

  // Check if scroll button should be shown
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.messages-container')
      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100)
      }
    }
    const scrollContainer = document.querySelector('.messages-container')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Dynamically measure input area height
  useLayoutEffect(() => {
    function updateInputHeight() {
      if (inputAreaRef.current) {
        setInputHeight(inputAreaRef.current.offsetHeight)
      }
    }
    updateInputHeight()
    window.addEventListener('resize', updateInputHeight)
    return () => window.removeEventListener('resize', updateInputHeight)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      <div className="flex-1 overflow-y-auto custom-scrollbar messages-container min-h-0">
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
              />
            ))}
            {/* Empty space at bottom for better UX */}
            <div className="h-48" />
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {/* Input Area */}
      <ChatInputArea
        onSend={onSend}
        status={status}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        webSearchEnabled={webSearchEnabled}
        setWebSearchEnabled={setWebSearchEnabled}
        showScrollButton={showScrollButton}
        scrollToBottom={scrollToBottom}
        inputAreaRef={inputAreaRef}
      />
    </div>
  )
}
