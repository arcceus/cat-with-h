import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/drizzle/db';
import { canvasesMeta } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: Promise<{ canvasId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const { canvasId } = await params;
  // Ensure meta exists for this user and canvas
  const meta = await db.query.canvasesMeta.findFirst({ where: (m, { eq, and }) => and(eq(m.canvasId, canvasId), eq(m.userId, userId)) });
  if (!meta) return new Response('Not found', { status: 404 });
  await db.update(canvasesMeta)
    .set({ pinned: true, updatedAt: new Date() })
    .where(and(eq(canvasesMeta.canvasId, canvasId), eq(canvasesMeta.userId, userId)));
  return new Response('Pinned', { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ canvasId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const { canvasId } = await params;
  // Ensure meta exists for this user and canvas
  const meta = await db.query.canvasesMeta.findFirst({ where: (m, { eq, and }) => and(eq(m.canvasId, canvasId), eq(m.userId, userId)) });
  if (!meta) return new Response('Not found', { status: 404 });
  await db.update(canvasesMeta)
    .set({ pinned: false, updatedAt: new Date() })
    .where(and(eq(canvasesMeta.canvasId, canvasId), eq(canvasesMeta.userId, userId)));
  return new Response('Unpinned', { status: 200 });
} 