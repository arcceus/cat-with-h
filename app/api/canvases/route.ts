import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/drizzle/db';
import { users, canvases, canvasesMeta } from '@/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });

  // Upsert user
  await db.insert(users)
    .values({ id: userId })
    .onConflictDoNothing();

  // Fetch all canvases for this user
  const userCanvases = await db.select().from(canvases).where(eq(canvases.userId, userId));
  const canvasIds = userCanvases.map(c => c.id);

  // Fetch all meta for these canvases
  let userMeta: any[] = [];
  if (canvasIds.length > 0) {
    userMeta = await db.select().from(canvasesMeta).where(
      inArray(canvasesMeta.canvasId, canvasIds)
    );
  }

  return Response.json({
    canvases: userCanvases,
    meta: userMeta,
    currentKey: userCanvases[0]?.id || null,
  });
}

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  let canvas;
  try {
    const body = await req.json();
    // Validate input
    if (!body || !body.key || !body.name) {
      return new Response('Missing required fields', { status: 400 });
    }
    // Upsert user
    await db.insert(users)
      .values({ id: userId })
      .onConflictDoNothing();
    // Insert canvas
    const now = new Date();
    canvas = await db.insert(canvases)
      .values({
        id: body.key,
        userId,
        name: body.name,
        nodes: [],
        edges: [],
        updatedAt: now,
      })
      .returning();
    // Insert meta
    await db.insert(canvasesMeta)
      .values({
        canvasId: body.key,
        userId,
        name: body.name,
        pinned: false,
        updatedAt: now,
      })
      .onConflictDoNothing();
  } catch (e) {
    return new Response('Failed to create canvas', { status: 500 });
  }
  return Response.json(canvas[0]);
} 