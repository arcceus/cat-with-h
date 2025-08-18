import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Search, Paperclip, ChevronDown, ChevronUp } from 'lucide-react'
import type { RefObject } from 'react'
import ModelSelector from './ModelSelector'

interface ChatInputAreaProps {
  onSend: (input: string) => void,
  status: string,
  webSearchEnabled: boolean,
  setWebSearchEnabled: (v: boolean) => void,
  showScrollButton: boolean,
  scrollToBottom: () => void,
  inputAreaRef: RefObject<HTMLDivElement | null>,
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSend,
  status,
  webSearchEnabled,
  setWebSearchEnabled,
  showScrollButton,
  scrollToBottom,
  inputAreaRef,
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
    <div ref={inputAreaRef as any} className="relative pr-4 pb-3 pl-4 bg-transparent">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-2">
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
            {/* Controls row below input: toggles, model, web, attach left; send right */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-start gap-1">
                <ModelSelector />
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
        <div className="absolute -top-12 left-1/2 bg-background rounded-full -translate-x-1/2 z-30">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full shadow-lg bg-background hover:bg-accent"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Button clicked')
                    scrollToBottom()
                  }}
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