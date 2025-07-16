"use client"

import { useChat } from 'ai/react'
import { useChatStore } from '../store/chatStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Send, 
  Bot, 
  User, 
  Copy, 
  RotateCcw, 
  Paperclip, 
  Search, 
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Brain
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const activeChat = chats.find(chat => chat.chatId === activeChatId)

  // Convert our Message type to Vercel AI SDK Message type
  const convertMessages = (messages: any[]) => {
    return messages.map(msg => ({
      id: msg.messageId || Math.random().toString(),
      role: (msg.content.ai ? 'assistant' : 'user') as 'assistant' | 'user',
      content: msg.content.ai || msg.content.user
    }))
  }

  const { messages, input, handleInputChange, handleSubmit, isLoading, reload } = useChat({
    // initialMessages: convertMessages(activeChat?.messages || []),
    onFinish: (message) => {
      // Update the chat store with new messages
      if (activeChatId) {
        const updatedMessages = [...messages, message]
        updateChatMessages(activeChatId, updatedMessages)
      }
    },
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check if scroll button should be shown
  useEffect(() => {
    const handleScroll = () => {
      if (scrollAreaRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100)
      }
    }

    const scrollArea = scrollAreaRef.current
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll)
      return () => scrollArea.removeEventListener('scroll', handleScroll)
    }
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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return
    
    handleSubmit(e)
  }

  if (!activeChatId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium">No chat selected</h3>
          <p className="text-sm text-muted-foreground">Select a chat from the sidebar to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Messages Area */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 px-4 py-4 pb-32"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
                How can I help you?
              </h1>
              <p className="text-lg text-muted-foreground font-light">
                I'm here to assist with your questions and tasks.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted border border-border'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="space-y-3">
                      <ReactMarkdown
                        components={{
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <div className="relative group">
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-md"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => copyToClipboard(String(children))}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                                {children}
                              </code>
                            )
                          },
                          p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
                          h1: ({ children }: any) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                          h2: ({ children }: any) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                          h3: ({ children }: any) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                          ul: ({ children }: any) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }: any) => <li className="text-sm">{children}</li>,
                          blockquote: ({ children }: any) => (
                            <blockquote className="border-l-4 border-primary/20 pl-4 italic text-muted-foreground">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => copyToClipboard(message.content)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => reload()}
                          disabled={isLoading}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-2 pb-4 pointer-events-auto">
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-2">
            {/* Input field with background container */}
            <div className="bg-muted/50 backdrop-blur rounded-2xl p-3">
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e)}
                placeholder="Type your message here..."
                className="w-full min-h-[60px] bg-muted/50 border-0 shadow-none focus:ring-0 focus:border-0 text-base px-2 resize-none outline-none"
                disabled={isLoading}
                style={{ 
                  background: 'transparent',
                  color: 'inherit'
                }}
              />
              {/* Controls row below input: model, web, attach left; send right */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground">
                        <selectedModel.icon className="h-3 w-3" />
                        {selectedModel.name}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {AI_MODELS.map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          onClick={() => setSelectedModel(model)}
                          className="flex items-center gap-2"
                        >
                          <model.icon className="h-3 w-3" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{model.name}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    type="button"
                    variant={webSearchEnabled ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading || !input.trim()}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
        {/* Scroll to bottom button, floating above input, centered */}
        {showScrollButton && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full shadow-lg"
                    onClick={scrollToBottom}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scroll to bottom</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  )
}
