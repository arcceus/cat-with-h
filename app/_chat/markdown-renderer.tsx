import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Copy, WrapText, FileText } from 'lucide-react';
import { useState } from 'react';

const getCodeBlockStyle = (isWrapped: boolean) => ({
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

const CodeBlock = ({ language, code, copyToClipboard, isStreaming, htmlProps }: {
  language: string
  code: string
  copyToClipboard: (text: string) => void
  isStreaming: boolean
  htmlProps?: any
}) => {
  const [isWrapped, setIsWrapped] = useState(false)

  return (
    <div {...(htmlProps || {})} className={cn("relative group my-2 rounded-md overflow-hidden select-text", "codeblock-markdown")}> 
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
      <div className={cn(
        "overflow-x-auto px-3 py-2",
        isWrapped && "whitespace-pre-wrap break-words"
      )}>
        <SyntaxHighlighter
          style={{}}
          language={language}
          PreTag="div"
          className="text-sm font-mono m-0"
          customStyle={getCodeBlockStyle(isWrapped)}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

export function MarkdownRenderer({ content, status, copyToClipboard }: {
  content: string,
  status: string,
  copyToClipboard: (text: string) => void
}) {
  const isStreaming = status === 'streaming';
  // remark plugin to add data-sourcepos attributes from mdast positions
  const remarkAddSourcePos = () => (tree: any) => {
    function visit(node: any) {
      if (node && node.position) {
        node.data = node.data || {};
        node.data.hProperties = node.data.hProperties || {};
        const pos = node.position;
        node.data.hProperties['data-sourcepos'] = `${pos.start.line}:${pos.start.column}-${pos.end.line}:${pos.end.column}`;
      }
      if (node && Array.isArray(node.children)) {
        for (const child of node.children) visit(child);
      }
    }
    visit(tree);
  };
  return (
    <div className="space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkAddSourcePos as any]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <CodeBlock 
                language={match[1]} 
                code={String(children).replace(/\n$/, '')}
                copyToClipboard={copyToClipboard}
                isStreaming={isStreaming}
                htmlProps={props}
              />
            ) : (
              <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono select-text" {...props}>
                {children}
              </code>
            )
          },
          strong: ({ children, ...props }: any) => <strong {...props} className="font-semibold select-text">{children}</strong>,
          em: ({ children, ...props }: any) => <em {...props} className="italic select-text">{children}</em>,
          p: ({ children, ...props }: any) => <p {...props} className="mb-4 text-base leading-relaxed tracking-normal text-foreground select-text">{children}</p>,
          h1: ({ children, ...props }: any) => <h1 {...props} className="text-2xl font-bold mb-3 mt-6 text-foreground select-text">{children}</h1>,
          h2: ({ children, ...props }: any) => <h2 {...props} className="text-xl font-semibold mb-2 mt-5 text-foreground select-text">{children}</h2>,
          h3: ({ children, ...props }: any) => <h3 {...props} className="text-lg font-semibold mb-2 mt-4 text-foreground select-text">{children}</h3>,
          ul: ({ children, ...props }: any) => <ul {...props} className="mb-4 pl-6 space-y-2 text-base text-foreground select-text" style={{ listStyleType: 'disc' }}>{children}</ul>,
          ol: ({ children, ...props }: any) => <ol {...props} className="mb-4 pl-6 space-y-2 text-base text-foreground select-text" style={{ listStyleType: 'decimal' }}>{children}</ol>,
          li: ({ children, ...props }: any) => <li {...props} className="text-base leading-relaxed text-foreground select-text">{children}</li>,
          blockquote: ({ children, ...props }: any) => (
            <blockquote {...props} className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4 py-1 select-text">{children}</blockquote>
          ),
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
} 