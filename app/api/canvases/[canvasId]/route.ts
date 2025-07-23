import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/drizzle/db';
import { canvases, canvasesMeta, users } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ canvasId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const { canvasId } = await params;
  
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  
  if (!body.data) return new Response('Missing data field', { status: 400 });
  
  // Upsert user
  await db.insert(users)
    .values({ id: userId })
    .onConflictDoNothing();
  
  // Upsert canvas
  const now = new Date();
  await db.insert(canvases)
    .values({
      id: canvasId,
      userId,
      name: canvasId, // Default name, can be changed via rename endpoint
      nodes: body.data.nodes || [],
      edges: body.data.edges || [],
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: canvases.id,
      set: {
        nodes: body.data.nodes || [],
        edges: body.data.edges || [],
        updatedAt: now,
      },
    });
  
  // Ensure meta exists for this canvas
  await db.insert(canvasesMeta)
    .values({
      canvasId,
      userId,
      name: canvasId, // Default name
      pinned: false,
      updatedAt: now,
    })
    .onConflictDoNothing();
  
  return new Response('Canvas saved', { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ canvasId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const { canvasId } = await params;
  
  // Delete canvas meta first (foreign key constraint)
  await db.delete(canvasesMeta).where(and(eq(canvasesMeta.canvasId, canvasId), eq(canvasesMeta.userId, userId)));
  
  // Delete canvas (ensure it belongs to user)
  await db.delete(canvases).where(and(eq(canvases.id, canvasId), eq(canvases.userId, userId)));
  
  return new Response('Canvas deleted', { status: 200 });
} 