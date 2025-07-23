import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../drizzle/db';
import { canvases, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Canvases DB', () => {
  const testUserId = 'user_test_canvas';
  const testCanvasId = 'canvas_test_db';

  beforeAll(async () => {
    // Create test user first
    await db.insert(users).values({
      id: testUserId,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(canvases).where(eq(canvases.id, testCanvasId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('inserts and fetches a canvas', async () => {
    await db.insert(canvases).values({
      id: testCanvasId,
      userId: testUserId,
      name: 'DB Test Canvas',
      nodes: [],
      edges: [],
      updatedAt: new Date(),
    });
    const result = await db.select().from(canvases).where(eq(canvases.id, testCanvasId));
    expect(result[0].name).toBe('DB Test Canvas');
  });
}); 