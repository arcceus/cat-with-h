import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Copy, RotateCcw, WrapText, FileText } from 'lucide-react'
import { useState } from 'react'

// CodeBlock component with header and buttons
const CodeBlock = ({ language, code, copyToClipboard, isStreaming }: {
  language: string
  code: string
  copyToClipboard: (text: string) => void
  isStreaming: boolean
}) => {
  const [isWrapped, setIsWrapped] = useState(false)

  return (
    <div className="relative group my-2 border border-border rounded-md overflow-hidden">
      {/* Header with language and buttons */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase">{language}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-70 hover:opacity-100 transition-opacity"
            onClick={() => setIsWrapped(!isWrapped)}
            title={isWrapped ? "Disable text wrapping" : "Enable text wrapping"}
          >
            {isWrapped ? <FileText className="h-3 w-3" /> : <WrapText className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-70 hover:opacity-100 transition-opacity"
            onClick={() => copyToClipboard(code)}
            title="Copy to clipboard"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Code content */}
      <div className={cn(
        "overflow-x-auto",
        isWrapped && "whitespace-pre-wrap break-words"
      )}>
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="text-sm font-mono m-0"
          customStyle={{ 
            minWidth: 0, 
            maxWidth: '100%', 
            fontSize: '0.95rem', 
            background: 'var(--muted)', 
            border: 'none',
            padding: '1rem',
            margin: 0,
            // Optimize for streaming performance
            willChange: isStreaming ? 'contents' : 'auto',
            whiteSpace: isWrapped ? 'pre-wrap' : 'pre'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

const ChatMessage = React.memo(function ChatMessage({ 
  message, 
  status, 
  copyToClipboard,
  'data-message-id': dataMessageId,
  ...props 
}: { 
  message: { id: string; role: 'user' | 'assistant'; content: string }, 
  status: string, 
  copyToClipboard: (text: string) => void,
  'data-message-id'?: string
}) {
  // Optimize for streaming performance
  const isStreaming = status === 'streaming' && message.id === 'pending-ai'
  
  return (
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
        "flex gap-4 mr-[12px] mt-[10px] mb-[40px] chat-message",
        message.role === 'user' ? 'justify-end' : message.role === 'assistant' ? 'justify-start' : ''
      )}
      data-message-id={dataMessageId}
    >
      <div
        className={cn(
          "max-w-3xl rounded-lg px-4 py-3 transition-colors duration-300",
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background',
          isStreaming && 'streaming-message' // Apply streaming optimizations
        )}
      >
        {message.role === 'assistant' ? (
          <div className="space-y-3">
            <ReactMarkdown
              components={{
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <CodeBlock 
                      language={match[1]} 
                      code={String(children).replace(/\n$/, '')}
                      copyToClipboard={copyToClipboard}
                      isStreaming={isStreaming}
                    />
                  ) : (
                    <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  )
                },
                p: ({ children }: any) => <p className="mb-4 text-base leading-relaxed tracking-normal text-foreground">{children}</p>,
                h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-3 mt-6 text-foreground">{children}</h1>,
                h2: ({ children }: any) => <h2 className="text-xl font-semibold mb-2 mt-5 text-foreground">{children}</h2>,
                h3: ({ children }: any) => <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground">{children}</h3>,
                ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 pl-6 space-y-2 text-base text-foreground">{children}</ul>,
                ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 pl-6 space-y-2 text-base text-foreground">{children}</ol>,
                li: ({ children }: any) => <li className="text-base leading-relaxed text-foreground">{children}</li>,
                blockquote: ({ children }: any) => (
                  <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4 py-1">{children}</blockquote>
                ),
              }}
            >
              {message.content || ''}
            </ReactMarkdown>
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
                onClick={() => copyToClipboard(message.content)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {/* reload() */}}
                disabled={status === 'streaming' || status === 'submitted'}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Regenerate
              </Button>
            </div>
            
          </div>
        ) : (
          <div>
          <p className="text-sm">{message.content || ''}</p>
          </div>
        )}


      </div>
      
    </motion.div>
  )
})

export default ChatMessage 