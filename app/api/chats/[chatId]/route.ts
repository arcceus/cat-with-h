import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/drizzle/db';
import { chats } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const { chatId } = await params;
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  if (!body.title) return new Response('Missing title', { status: 400 });
  // Ensure chat belongs to user
  const chat = await db.query.chats.findFirst({ where: (c, { eq, and }) => and(eq(c.id, chatId), eq(c.userId, userId)) });
  if (!chat) return new Response('Not found', { status: 404 });
  await db.update(chats)
    .set({ title: body.title, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
  return new Response('Updated', { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const { chatId } = await params;
  // Ensure chat belongs to user
  const chat = await db.query.chats.findFirst({ where: (c, { eq, and }) => and(eq(c.id, chatId), eq(c.userId, userId)) });
  if (!chat) return new Response('Not found', { status: 404 });
  await db.delete(chats).where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
  return new Response('Deleted', { status: 200 });
} 