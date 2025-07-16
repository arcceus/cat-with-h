import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Copy, RotateCcw } from 'lucide-react'

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
  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex gap-4 mr-[12px] mt-[10px] mb-[40px]",
        message.role === 'user' ? 'justify-end' : message.role === 'assistant' ? 'justify-start' : ''
      )}
      data-message-id={dataMessageId}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 transition-colors duration-300",
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background'
        )}
      >
        {message.role === 'assistant' ? (
          <div className="space-y-3">
            <ReactMarkdown
              components={{
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <div className="relative group my-2">
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md text-sm max-w-full border border-border bg-muted/80 p-3 font-mono"
                        customStyle={{ minWidth: 0, maxWidth: '100%', fontSize: '0.95rem', background: 'var(--muted)', border: '1px solid var(--border)' }}
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