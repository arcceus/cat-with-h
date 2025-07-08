import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MarkdownRenderer: React.FC<{ content: string; messageId: string; onTextSelection: (messageId: string, selectedText: string) => void }> = ({ 
  content, 
  messageId, 
  onTextSelection 
}) => {
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      onTextSelection(messageId, selection.toString());
    }
  };

  return (
    <div 
      className="text-base leading-relaxed cursor-text"
      onMouseUp={handleMouseUp}
      style={{ userSelect: 'text' }}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mb-2">{children}</h3>,
          p: (props) => {
            const node: any = props.node;
            if (node?.parent?.type === 'listItem') {
              return <p className="mb-0 leading-relaxed">{props.children}</p>;
            }
            return <p className="mt-1 mb-4 leading-relaxed">{props.children}</p>;
          },
          ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2" style={{ counterReset: 'list-counter' }}>{children}</ol>,
          li: ({ children }) => <li className="ml-4 leading-relaxed" style={{ display: 'list-item' }}>{children}</li>,
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  style={{
                    background: '#393a36',
                    color: '#9a9fa1',
                    padding: '0.01em 0.5em 0.2rem',
                    borderRadius: '9999px',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                  }}
                >
                  {children}
                </code>
              );
            }
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            return (
              <div className="mb-6">
                <SyntaxHighlighter
                  style={oneDark}
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: '8px',
                    backgroundColor: '#373432',
                  }}
                  codeTagProps={{
                    style: { background: 'none' }
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-600 pl-4 italic mb-4">{children}</blockquote>
          ),
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          text: ({ children }) => <span>{children}</span>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 