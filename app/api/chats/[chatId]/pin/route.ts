import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/drizzle/db';
import { pinnedChats, chats } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const { chatId } = await params;
  // Ensure chat belongs to user
  const chat = await db.query.chats.findFirst({ where: (c, { eq, and }) => and(eq(c.id, chatId), eq(c.userId, userId)) });
  if (!chat) return new Response('Not found', { status: 404 });
  await db.insert(pinnedChats).values({ userId, chatId }).onConflictDoNothing();
  return new Response('Pinned', { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const { chatId } = await params;
  // Ensure chat belongs to user
  const chat = await db.query.chats.findFirst({ where: (c, { eq, and }) => and(eq(c.id, chatId), eq(c.userId, userId)) });
  if (!chat) return new Response('Not found', { status: 404 });
  await db.delete(pinnedChats).where(
    and(eq(pinnedChats.userId, userId), eq(pinnedChats.chatId, chatId))
  );
  return new Response('Unpinned', { status: 200 });
} 