import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../drizzle/db';
import { chats, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Chats DB', () => {
  const testUserId = 'user_test';
  const testChatId = 'chat_test_db';

  beforeAll(async () => {
    // Create test user first
    await db.insert(users).values({
      id: testUserId,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(chats).where(eq(chats.id, testChatId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('inserts and fetches a chat', async () => {
    await db.insert(chats).values({
      id: testChatId,
      userId: testUserId,
      title: 'DB Test Chat',
      updatedAt: new Date(),
    });
    const result = await db.select().from(chats).where(eq(chats.id, testChatId));
    expect(result[0].title).toBe('DB Test Chat');
  });
}); 