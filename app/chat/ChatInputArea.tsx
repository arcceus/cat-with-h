import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Search, Paperclip, ChevronDown, ChevronUp } from 'lucide-react'
import type { RefObject } from 'react'

interface ChatInputAreaProps {
  onSend: (input: string) => void,
  status: string,
  selectedModel: any,
  setSelectedModel: (model: any) => void,
  webSearchEnabled: boolean,
  setWebSearchEnabled: (v: boolean) => void,
  showScrollButton: boolean,
  scrollToBottom: () => void,
  inputAreaRef: RefObject<HTMLDivElement | null>,
  AI_MODELS?: any[]
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSend,
  status,
  selectedModel,
  setSelectedModel,
  webSearchEnabled,
  setWebSearchEnabled,
  showScrollButton,
  scrollToBottom,
  inputAreaRef,
  AI_MODELS = [
    { id: 'gpt-4', name: 'GPT-4', icon: ChevronUp, description: 'Most capable model' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', icon: ChevronUp, description: 'Fast and efficient' },
    { id: 'claude-3', name: 'Claude 3', icon: ChevronUp, description: 'Anthropic\'s latest' },
  ],
}) => {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = ''
  }

  return (
    <div ref={inputAreaRef as any} className="fixed bottom-0 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-2 pb-4 pointer-events-auto">
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-2">
          {/* Input field with background container */}
          <div className="bg-muted/50 backdrop-blur rounded-2xl p-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e as any);
                }
              }}
              placeholder="Type your message here..."
              className="w-full min-h-[60px] bg-muted/50 border-0 shadow-none focus:ring-0 focus:border-0 text-base px-2 resize-none outline-none"
              disabled={status === 'streaming' || status === 'submitted'}
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
                disabled={status === 'streaming' || status === 'submitted' || !input.trim()}
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
  )
}

export default ChatInputArea 