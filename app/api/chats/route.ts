import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/drizzle/db';
import { users, chats, messages, pinnedChats } from '@/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });

  // Upsert user
  await db.insert(users)
    .values({ id: userId })
    .onConflictDoNothing();

  // Fetch all chats for this user
  const userChats = await db.select().from(chats).where(eq(chats.userId, userId));
  const chatIds = userChats.map(c => c.id);

  // Fetch all messages for these chats
  let userMessages: any[] = [];
  if (chatIds.length > 0) {
    userMessages = await db.select().from(messages).where(
      inArray(messages.chatId, chatIds)
    );
  }

  // Fetch pinned chats for this user
  const userPinned = await db.select().from(pinnedChats).where(eq(pinnedChats.userId, userId));

  return Response.json({
    chats: userChats,
    messages: userMessages,
    pinned: userPinned.map(p => p.chatId),
  });
}

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  let chat;
  try {
    const body = await req.json();
    // Validate input - handle both 'id' and 'chatId' for flexibility
    const chatId = body.id || body.chatId;
    if (!body || !chatId || !body.title || !body.updatedAt) {
      return new Response('Missing required fields: id/chatId, title, updatedAt', { status: 400 });
    }
    // Upsert user
    await db.insert(users)
      .values({ id: userId })
      .onConflictDoNothing();
    // Insert chat
    chat = await db.insert(chats)
      .values({
        id: chatId,
        userId,
        title: body.title,
        updatedAt: new Date(body.updatedAt),
      })
      .returning();
  } catch (e) {
    console.error('Error creating chat:', e);
    return new Response('Failed to create chat', { status: 500 });
  }
  return Response.json(chat[0]);
} 