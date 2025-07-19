import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Copy, RotateCcw, WrapText, FileText } from 'lucide-react'
import { useState } from 'react'

const getCodeBlockStyle = (isWrapped: boolean) => ({
  minWidth: 0,
  maxWidth: '100%',
  fontSize: '0.95rem',
  background: 'var(--color-card, var(--card))',
  color: 'var(--color-foreground, var(--foreground))',
  border: 'none',
  borderRadius: 'var(--radius-md, 0.35rem)',
  boxShadow: 'none',
  padding: '0',
  margin: 0,
  lineHeight: 1.7,
  fontFamily: 'var(--font-mono, monospace)',
  whiteSpace: isWrapped ? 'pre-wrap' : 'pre',
});

const CodeBlock = ({ language, code, copyToClipboard, isStreaming }: {
  language: string
  code: string
  copyToClipboard: (text: string) => void
  isStreaming: boolean
}) => {
  const [isWrapped, setIsWrapped] = useState(false)

  return (
    <div className={cn("relative group my-2 rounded-md overflow-hidden", "codeblock-markdown")}>
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
        "overflow-x-auto px-3 py-2",
        isWrapped && "whitespace-pre-wrap break-words"
      )}>
        <SyntaxHighlighter
          style={{}}
          language={language}
          PreTag="div"
          className="text-sm font-mono m-0 overflow-x-auto"
          customStyle={getCodeBlockStyle(isWrapped)}
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
            "max-w-3xl rounded-lg px-4 py-3 transition-colors duration-300 relative select-text",
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
                  ul: ({ children }: any) => (
                    <ul className="mb-4 pl-6 space-y-2 text-base text-foreground">
                      {React.Children.toArray(children)
                        .filter(child => {
                          if (typeof child === 'string') return child.trim() !== '';
                          if (React.isValidElement(child)) {
                            const el = child as React.ReactElement;
                            const props = el.props as any;
                            if ('children' in props) {
                              if (typeof props.children === 'string') {
                                return props.children.trim() !== '';
                              }
                              // If it's a React element or array, keep it
                              return !!props.children;
                            }
                          }
                          return !!child;
                        })
                        .map((child, idx) => {
                          if (React.isValidElement(child) && child.type === 'li') {
                            return React.cloneElement(child, { key: idx });
                          }
                          return (
                            <li className="flex items-start" key={idx}>
                              <span className="select-text mr-2">•</span>
                              <span>{child}</span>
                            </li>
                          );
                        })}
                    </ul>
                  ),
                  ol: ({ children }: any) => (
                    <ol className="mb-4 pl-6 space-y-2 text-base text-foreground">
                      {React.Children.toArray(children)
                        .filter(child => {
                          if (typeof child === 'string') return child.trim() !== '';
                          if (React.isValidElement(child)) {
                            const el = child as React.ReactElement;
                            const props = el.props as any;
                            if ('children' in props) {
                              if (typeof props.children === 'string') {
                                return props.children.trim() !== '';
                              }
                              return !!props.children;
                            }
                          }
                          return !!child;
                        })
                        .map((child, idx) => {
                          if (React.isValidElement(child) && child.type === 'li') {
                            return React.cloneElement(child, { key: idx });
                          }
                          return (
                            <li className="flex items-start" key={idx}>
                              <span className="select-text mr-2">{idx + 1}.</span>
                              <span>{child}</span>
                            </li>
                          );
                        })}
                    </ol>
                  ),
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
    </div>
  )
})

export default ChatMessage 