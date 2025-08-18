import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Copy, RotateCcw } from 'lucide-react'
import { MarkdownRenderer } from './markdown-renderer';

const ChatMessage = React.memo(function ChatMessage({ 
  message, 
  status, 
  copyToClipboard,
  'data-message-id': dataMessageId,
  chatId,
  messageId,
  onRegenerate,
  ...props 
}: { 
  message: { id: string; role: 'user' | 'assistant'; content: string }, 
  status: string, 
  copyToClipboard: (text: string) => void,
  'data-message-id'?: string,
  chatId?: string,
  messageId?: string,
  onRegenerate?: () => void,
}) {
  // Optimize for streaming performance
  const isStreaming = status === 'streaming' && message.id === 'pending-ai'
  const isThinking = (status === 'loading' || status === 'submitted') && message.id === 'thinking-ai'
  const isSubmitting = status === 'submitted' && message.id === 'pending-user'

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ 
          duration: isStreaming || isThinking || isSubmitting ? 0.1 : 0.2, // Faster animation for streaming, thinking, and submitting
          ease: isStreaming || isThinking || isSubmitting ? "easeOut" : "easeInOut" // Smoother easing for streaming, thinking, and submitting
        }}
        className={cn(
          "flex w-full mb-[40px] chat-message", // remove global select-text
          message.role === 'user' ? 'justify-end' : 'justify-start',
          (isStreaming || isThinking || isSubmitting) && 'opacity-50'
        )}
        data-message-id={dataMessageId}
      >
        <div
          className={cn(
            "max-w-[99%] rounded-lg px-4 py-3 transition-colors duration-300 relative",
            message.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background',
            (isStreaming || isThinking || isSubmitting) && 'streaming-message' // Apply streaming optimizations
          )}
          onDragStartCapture={(e: React.DragEvent<HTMLDivElement>) => {
            // Cancel drags unless the user already has a text selection inside this message
            const selection = window.getSelection();
            const container = e.currentTarget as HTMLDivElement;
            if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            const range = selection.getRangeAt(0);
            if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            if (chatId) e.dataTransfer.setData('application/x-chat-id', chatId);
            if (messageId) e.dataTransfer.setData('application/x-message-id', messageId);

            // Helpers declared before use
            const parseSourcePos = (el: Element | null) => {
              if (!el) return null as null | { start: { line: number; column: number }, end: { line: number; column: number } };
              const sp = el.getAttribute('data-sourcepos');
              if (!sp) return null;
              const m = sp.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
              if (!m) return null;
              return {
                start: { line: Number(m[1]), column: Number(m[2]) },
                end: { line: Number(m[3]), column: Number(m[4]) },
              };
            };
            const closestWithSourcePos = (node: Node | null): Element | null => {
              let n: Node | null = node;
              while (n && n !== container) {
                if (n instanceof Element && n.hasAttribute('data-sourcepos')) return n;
                n = n.parentNode;
              }
              return null;
            };
            const findOutermostAncestorList = (node: Node | null): Element | null => {
              let el: Element | null = node instanceof Element ? node : node?.parentElement || null;
              let lastList: Element | null = null;
              while (el && el !== container) {
                const tag = el.tagName;
                if (tag === 'UL' || tag === 'OL') {
                  lastList = el;
                }
                el = el.parentElement;
              }
              return lastList;
            };
            const buildLineStartIndices = (src: string) => {
              const starts: number[] = [0];
              for (let i = 0; i < src.length; i++) {
                if (src[i] === '\n') starts.push(i + 1);
              }
              return starts;
            };
            const toIndex = (lineStarts: number[], line: number, column: number) => {
              const base = lineStarts[Math.max(0, line - 1)] ?? 0;
              const offset = Math.max(0, column - 1);
              return base + offset;
            };

            let textToTransfer = message.content;
            // If there is a user selection inside this message, prefer using it
            if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
              const range = selection.getRangeAt(0);
              if (container.contains(range.startContainer) && container.contains(range.endContainer)) {
                // 1) Try sourcepos-based mapping first to preserve markdown formatting
                // Prefer slicing whole list blocks if selection is inside lists
                const startListEl = findOutermostAncestorList(range.startContainer);
                const endListEl = findOutermostAncestorList(range.endContainer);
                const startEl = (startListEl || closestWithSourcePos(range.startContainer));
                const endEl = (endListEl || closestWithSourcePos(range.endContainer));
                const startPos = parseSourcePos(startEl);
                const endPos = parseSourcePos(endEl);
                if (startPos && endPos) {
                  const lineStarts = buildLineStartIndices(message.content);
                  const absStart = toIndex(lineStarts, startPos.start.line, startPos.start.column);
                  const absEnd = toIndex(lineStarts, endPos.end.line, endPos.end.column);
                  if (absEnd > absStart) {
                    textToTransfer = message.content.slice(absStart, Math.min(absEnd, message.content.length));
                    // Ensure trailing newline when slicing list blocks to preserve formatting
                    if ((startListEl || endListEl) && !textToTransfer.endsWith('\n')) {
                      textToTransfer = textToTransfer + '\n';
                    }
                  }
                }
                // 2) If sourcepos failed, fallback to block-level slice
                if (textToTransfer === message.content) {
                  const blockEl = (startListEl || endListEl || startEl || endEl);
                  const blockPos = parseSourcePos(blockEl);
                  if (blockPos) {
                    const lineStarts = buildLineStartIndices(message.content);
                    const absStart = toIndex(lineStarts, blockPos.start.line, blockPos.start.column);
                    const absEnd = toIndex(lineStarts, blockPos.end.line, blockPos.end.column);
                    if (absEnd > absStart) {
                      textToTransfer = message.content.slice(absStart, Math.min(absEnd, message.content.length));
                      if ((startListEl || endListEl) && !textToTransfer.endsWith('\n')) {
                        textToTransfer = textToTransfer + '\n';
                      }
                    }
                  }
                }
                // 3) If still unchanged, fallback to literal match or plain text
                if (textToTransfer === message.content) {
                  const selectedText = selection.toString();
                  if (selectedText && selectedText.trim().length > 0) {
                    const idx = message.content.indexOf(selectedText);
                    if (idx !== -1) {
                      textToTransfer = message.content.slice(idx, idx + selectedText.length);
                    } else {
                      textToTransfer = selectedText;
                    }
                  }
                }
              }
            }

            // Always set text/plain so the canvas receives whatever we derived (markdown slice or fallback)
            e.dataTransfer.setData('text/plain', textToTransfer);
          }}
        >
          {message.role === 'assistant' ? (
            <>
              {/* Special handling for thinking state */}
              {isThinking ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground italic">{message.content}</span>
                </div>
              ) : (
                <MarkdownRenderer
                  content={message.content}
                  status={status}
                  copyToClipboard={copyToClipboard}
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
              
              {/* Action buttons - only show when not thinking */}
              {!isThinking && (
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
                </div>
              )}
            </>
          ) : (
            <div>
              <p className="text-sm">{message.content || ''}</p>
              {/* Show loading indicator for submitted user messages */}
              {isSubmitting && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary-foreground/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-primary-foreground/70">Sending...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
})

export default ChatMessage 