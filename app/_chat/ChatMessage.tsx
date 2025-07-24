import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Copy, RotateCcw, MousePointerClick } from 'lucide-react'
import { MarkdownRenderer } from './markdown-renderer';
import { MarkdownWithMarkers } from './MarkdownWithMarkers';

const ChatMessage = React.memo(function ChatMessage({ 
  message, 
  status, 
  copyToClipboard,
  selectionMode = false,
  'data-message-id': dataMessageId,
  chatId,
  messageId,
  onToggleSelectionMode,
  onRegenerate,
  ...props 
}: { 
  message: { id: string; role: 'user' | 'assistant'; content: string }, 
  status: string, 
  copyToClipboard: (text: string) => void,
  selectionMode?: boolean,
  'data-message-id'?: string,
  chatId?: string,
  messageId?: string,
  onToggleSelectionMode?: () => void,
  onRegenerate?: () => void,
}) {
  // Optimize for streaming performance
  const isStreaming = status === 'streaming' && message.id === 'pending-ai'

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ 
          duration: isStreaming ? 0.1 : 0.2, // Faster animation for streaming
          ease: isStreaming ? "easeOut" : "easeInOut" // Smoother easing for streaming
        }}
        className={cn(
          "flex w-full mb-[40px] chat-message select-text", // ensure select-text for selection
          message.role === 'user' ? 'justify-end' : 'justify-start',
          isStreaming && 'opacity-50'
        )}
        data-message-id={dataMessageId}
      >
        <div
          className={cn(
            "max-w-[99%] rounded-lg px-4 py-3 transition-colors duration-300 relative select-text",
            message.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background',
            isStreaming && 'streaming-message' // Apply streaming optimizations
          )}
          onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
            if (chatId) e.dataTransfer.setData('application/x-chat-id', chatId);
            if (messageId) e.dataTransfer.setData('application/x-message-id', messageId);
          }}
        >
          {message.role === 'assistant' ? (
            <>
              {selectionMode ? (
                <MarkdownWithMarkers
                  content={message.content}
                  className="markdown-with-markers"
                />
              ) : (
                <MarkdownRenderer
                  content={message.content}
                  status={status}
                  copyToClipboard={copyToClipboard}
                  selectionMode={selectionMode}
                  onPreCopy={selectionMode ? (e => {
                    e.preventDefault();
                    if (e.clipboardData) {
                      e.clipboardData.setData('text/plain', message.content);
                    }
                  }) : undefined}
                />
              )}
              {/* Typing indicator for streaming */}
              {isStreaming && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">AI is typing...</span>
                </div>
              )}
              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  // Always copy the plain markdown text, not HTML
                  onClick={() => copyToClipboard(message.content)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button
                  variant={selectionMode ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={onToggleSelectionMode}
                >
                  <MousePointerClick className="h-3 w-3 mr-1" />
                  {selectionMode ? 'Selection On' : 'Select' }
                </Button>
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm">{message.content || ''}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
})

export default ChatMessage 