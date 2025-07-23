import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/drizzle/db';
import { chats, messages, users } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest, context: { params: Promise<{ chatId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const params = await context.params;
  const chatId = params.chatId;
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  if (!Array.isArray(body.messages)) return new Response('Missing messages array', { status: 400 });
  
  // Upsert user first
  await db.insert(users)
    .values({ id: userId })
    .onConflictDoNothing();
  
  // Check if chat exists, if not create it
  let chat = await db.query.chats.findFirst({ where: (c, { eq, and }) => and(eq(c.id, chatId), eq(c.userId, userId)) });
  if (!chat) {
    // Create chat with a default title, will be updated later by AI title generation
    await db.insert(chats).values({
      id: chatId,
      userId,
      title: `New Chat ${Date.now()}`, // Temporary title
      updatedAt: new Date(),
    });
  }
  
  // Delete old messages for this chat
  await db.delete(messages).where(eq(messages.chatId, chatId));
  
  // Convert Zustand message format to database format and insert
  if (body.messages.length > 0) {
    const dbMessages = [];
    for (const msg of body.messages) {
      // Each Zustand message has { chatId, messageId, content: { user, ai? } }
      // Convert to database format: { id, chatId, role, content, createdAt }
      
      // Add user message
      if (msg.content.user) {
        dbMessages.push({
          id: `${msg.messageId}-user`,
          chatId,
          role: 'user',
          content: msg.content.user,
          createdAt: new Date(),
        });
      }
      
      // Add AI message if it exists
      if (msg.content.ai) {
        dbMessages.push({
          id: `${msg.messageId}-ai`, 
          chatId,
          role: 'assistant',
          content: msg.content.ai,
          createdAt: new Date(),
        });
      }
    }
    
    if (dbMessages.length > 0) {
      await db.insert(messages).values(dbMessages);
    }
  }
  
  // Update chat's updatedAt
  await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));
  return new Response('Messages updated', { status: 200 });
} 