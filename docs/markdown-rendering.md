### Markdown rendering and chat → canvas transfer

This document explains how markdown is rendered in both the chat UI and the canvas nodes, and how chat content is transferred into a canvas node.

---

## High-level overview

- **Shared renderer**: Both chat messages and canvas nodes render markdown through the same `MarkdownRenderer` component.
- **Transfer mechanism**: Text is transferred from chat to canvas via native browser drag-and-drop of selected text. Metadata (chat/message identifiers) is attached to the drag payload so nodes can link back to the originating chat message.
- **Cross-navigation**: Double-clicking a canvas node dispatches an event that switches to the originating chat and scrolls to the message.

---

## Components involved

- `app/_chat/markdown-renderer.tsx`: Shared markdown renderer used in chat and nodes.
- `app/_chat/ChatMessage.tsx`: Renders individual messages; enables selection, copy, and drag payload metadata.
- `app/_chat/ChatPage.tsx`: Flattens messages for display, manages streaming UI, and handles the scroll-back event from nodes.
- `app/_canvas/page.tsx`: React Flow canvas; handles drops to create nodes from dragged text and metadata.
- `app/_canvas/customNode.tsx`: React Flow custom node; renders markdown and offers double-click jump-back to chat.

---

## Markdown rendering

### Shared renderer: `MarkdownRenderer`

Key behaviors:
- Uses `react-markdown` for markdown parsing.
- Supports fenced code blocks with syntax highlighting via `react-syntax-highlighter` (Prism) and a custom code block toolbar (wrap toggle and copy).
- In selection mode (chat only), shows a preformatted plain-text block of the raw markdown above the rendered output to make copying exact markdown easy.

Relevant snippet:

```76:128:app/_chat/markdown-renderer.tsx
export function MarkdownRenderer({ content, status, copyToClipboard, selectionMode = false, onPreCopy }: {
  content: string,
  status: string,
  copyToClipboard: (text: string) => void,
  selectionMode?: boolean,
  onPreCopy?: (e: React.ClipboardEvent<HTMLPreElement>) => void
}) {
  const isStreaming = status === 'streaming';
  return (
    <div className="space-y-3">
      {selectionMode && (
        <pre
          className="bg-muted/40 border border-dashed border-border rounded p-2 mb-2 text-xs font-mono whitespace-pre-wrap break-words select-text"
          style={{ userSelect: 'text', wordBreak: 'break-word' }}
          onCopy={onPreCopy}
        >
          {content}
        </pre>
      )}
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
          ul: ({ children }: any) => <ul className="mb-4 pl-6 space-y-2 text-base text-foreground" style={{ listStyleType: 'disc' }}>{children}</ul>,
          ol: ({ children }: any) => <ol className="mb-4 pl-6 space-y-2 text-base text-foreground" style={{ listStyleType: 'decimal' }}>{children}</ol>,
          li: ({ children }: any) => <li className="text-base leading-relaxed text-foreground">{children}</li>,
          blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4 py-1">{children}</blockquote>
          ),
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}
```

### In chat

- Assistant messages render via `MarkdownRenderer`.
- Users can toggle selection mode to see and copy the raw markdown.
- Copy button copies the underlying markdown content, not HTML.

```65:118:app/_chat/ChatMessage.tsx
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
    <div className="flex items-center gap-2 pt-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => copyToClipboard(message.content)}
      >
        Copy
      </Button>
      <Button
        variant={selectionMode ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={onToggleSelectionMode}
      >
        {selectionMode ? 'Selection On' : 'Select' }
      </Button>
    </div>
  </>
) : (
  <div>
    <p className="text-sm">{message.content || ''}</p>
  </div>
)}
```

### In canvas node

- Nodes use the same `MarkdownRenderer` with `status="ready"` (non-streaming).
- Node content is resolved as `data.content || data.html || data.subtitle` so nodes can be hydrated from either dragged text or legacy props.

```64:71:app/_canvas/customNode.tsx
{typeof data.chatId === 'string' ? (
  <div style={{ fontWeight: 600, fontSize: '10px', marginBottom: 4, color: 'var(--muted-foreground)' }}>From: {data.chatId}</div>
) : null}
<MarkdownRenderer
  content={String(content)}
  status="ready"
  copyToClipboard={() => {}}
/>
```

---

## Transfer: chat → canvas node (drag & drop)

### What gets dragged

- The browser automatically puts the user's selected text into the drag payload under `text/plain`.
- The chat message also attaches metadata so the canvas node can keep a backlink:
  - `application/x-chat-id`: the current chat id
  - `application/x-message-id`: the message id (the flattened UI id)

```60:64:app/_chat/ChatMessage.tsx
onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
  if (chatId) e.dataTransfer.setData('application/x-chat-id', chatId);
  if (messageId) e.dataTransfer.setData('application/x-message-id', messageId);
}}
```

Notes:
- If the user wants to drag the entire message without selecting any text, consider also setting `text/plain` in `onDragStart` to `message.content`.

### Where the drop is handled

- The React Flow canvas listens for drops. It reads the native `text/plain` selection and the custom metadata, converts screen coordinates to flow coordinates, and creates a `custom` node with that content and metadata.

```145:163:app/_canvas/page.tsx
onDrop={event => {
  event.preventDefault();
  const text = event.dataTransfer.getData('text/plain');
  const chatId = event.dataTransfer.getData('application/x-chat-id');
  const messageId = event.dataTransfer.getData('application/x-message-id');
  if (!text) return;
  const position = reactFlowInstance.screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });
  setNodes(nds => nds.concat({
    id: `dnd_${Date.now()}`,
    type: 'custom',
    position,
    data: { content: text, chatId, messageId },
  }));
}}
```

Result:
- A `custom` node appears at the drop point and renders the transferred markdown via `MarkdownRenderer`.

### Jumping back to chat from a node

- Double-clicking a node with metadata dispatches a custom event. The chat page listens for this event, focuses the correct chat, and scrolls to the specific message.

```51:57:app/_canvas/customNode.tsx
onDoubleClick={() => {
  if (data.chatId && data.messageId) {
    window.dispatchEvent(new CustomEvent('scroll-to-chat-message', {
      detail: { chatId: data.chatId, messageId: data.messageId }
    }));
  }
}}
```

```138:152:app/_chat/ChatPage.tsx
useEffect(() => {
  function handler(e: any) {
    const { chatId, messageId } = e.detail;
    if (chatId && setActiveChat) setActiveChat(chatId);
    setTimeout(() => {
      const el = document.querySelector(`[data-message-id='${messageId}']`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }
  window.addEventListener('scroll-to-chat-message', handler);
  return () => window.removeEventListener('scroll-to-chat-message', handler);
}, [setActiveChat]);
```

---

## Data and persistence

- Chat data is stored in `zustand` (`useChatStore`) and synchronized with APIs. Markdown is stored as plain strings in the message model.
- Canvas data (nodes/edges) is stored in `zustand` (`useCanvasStore`) and autosaved with a debounce when nodes or edges change.

Persistence references:
- `store/chatStore.ts`
- `store/canvasStore.ts`

---

## Streaming considerations in chat

- During streaming, an in-progress assistant message is rendered with `id: 'pending-ai'` and `status: 'streaming'`.
- The renderer reduces animation overhead and displays a subtle typing indicator.

```31:44:app/_chat/ChatMessage.tsx
const isStreaming = status === 'streaming' && message.id === 'pending-ai'

<motion.div
  transition={{ 
    duration: isStreaming ? 0.1 : 0.2,
    ease: isStreaming ? "easeOut" : "easeInOut"
  }}
  className={cn(
    "flex w-full mb-[40px] chat-message select-text",
    message.role === 'user' ? 'justify-end' : 'justify-start',
    isStreaming && 'opacity-50'
  )}
/>
```

---

## Extensibility notes

- **Drag full message without selection**: Set `text/plain` to `message.content` in `onDragStart` so a user can drag anywhere on the message without selecting text first.
- **HTML content**: `customNode.tsx` imports `DOMPurify`, but the current implementation renders markdown through `react-markdown` (not raw HTML). If you introduce raw HTML rendering, ensure to sanitize with `DOMPurify`.
- **Node header**: The node shows a small “From: {chatId}” label if metadata was attached. Adjust styling or link behavior as desired.
- **Copy behavior**: In chat, copy always uses the raw markdown string. Nodes pass a noop `copyToClipboard` by default; implement if you want code block copy inside nodes.

---

## Gotchas

- The transfer relies on native `text/plain` being present. If the user doesn’t select text before dragging, `text` may be empty and the drop will be ignored. Consider setting `text/plain` in `onDragStart` as mentioned above.
- Message ids in the chat list are the flattened UI ids (e.g., `messageId + '-user'` or `messageId + '-ai'`). When linking from nodes, ensure you pass the same id you set on `data-message-id`.

---

## Quick reference

- Renderer: `app/_chat/markdown-renderer.tsx`
- Chat item: `app/_chat/ChatMessage.tsx`
- Chat page: `app/_chat/ChatPage.tsx`
- Canvas: `app/_canvas/page.tsx`
- Node: `app/_canvas/customNode.tsx`
- Stores: `store/chatStore.ts`, `store/canvasStore.ts`


