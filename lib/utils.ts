import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts normalized DB data to Zustand chat store shape.
 * @param dbData { chats: DBChat[], messages: DBMessage[], pinned: string[] }
 * @returns Zustand store shape
 */
export function shapeDBToZustand(dbData: {
  chats: Array<{ id: string; title: string; updatedAt: string; }>,
  messages: Array<{ id: string; chatId: string; role: string; content: string; createdAt: string; }>,
  pinned: string[],
}) {
  // Group messages by chatId and convert to Zustand Message format
  const messagesByChat: Record<string, Record<string, any>> = {};
  
  for (const msg of dbData.messages) {
    if (!messagesByChat[msg.chatId]) messagesByChat[msg.chatId] = {};
    
    // Extract messageId from the DB message id (format: messageId-user or messageId-ai)
    const messageId = msg.id.replace(/-user$|-ai$/, '');
    
    if (!messagesByChat[msg.chatId][messageId]) {
      messagesByChat[msg.chatId][messageId] = {
        chatId: msg.chatId,
        messageId: messageId,
        content: {}
      };
    }
    
    // Add user or AI content based on role
    if (msg.role === 'user') {
      messagesByChat[msg.chatId][messageId].content.user = msg.content;
    } else if (msg.role === 'assistant') {
      messagesByChat[msg.chatId][messageId].content.ai = msg.content;
    }
  }

  // Convert grouped messages to arrays
  const messagesArrayByChat: Record<string, any[]> = {};
  for (const chatId in messagesByChat) {
    messagesArrayByChat[chatId] = Object.values(messagesByChat[chatId]);
  }

  // Build Zustand chats array
  const chats = dbData.chats.map(chat => ({
    chatId: chat.id,
    title: chat.title,
    updatedAt: chat.updatedAt,
    messages: messagesArrayByChat[chat.id] || [],
  }));

  // Build Zustand pinned object
  const pinned: Record<string, boolean> = {};
  for (const chatId of dbData.pinned) {
    pinned[chatId] = true;
  }

  return {
    chats,
    pinned,
    // Other Zustand state (activeChatId, search, etc.) should be handled separately
  };
}

// Quick inline test for shapeDBToZustand (ESM compatible)
if (typeof window === 'undefined' && process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  const mockDbData = {
    chats: [
      { id: 'chat1', title: 'First Chat', updatedAt: '2024-06-01T12:00:00Z' },
      { id: 'chat2', title: 'Second Chat', updatedAt: '2024-06-01T13:00:00Z' },
    ],
    messages: [
      { id: 'msg1', chatId: 'chat1', role: 'user', content: 'Hello', createdAt: '2024-06-01T12:01:00Z' },
      { id: 'msg2', chatId: 'chat1', role: 'assistant', content: 'Hi!', createdAt: '2024-06-01T12:01:10Z' },
      { id: 'msg3', chatId: 'chat2', role: 'user', content: 'Hey', createdAt: '2024-06-01T13:01:00Z' },
    ],
    pinned: ['chat2'],
  };
  console.log('shapeDBToZustand output:', shapeDBToZustand(mockDbData));
}
