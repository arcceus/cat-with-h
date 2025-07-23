import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/drizzle/db';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

// Removed edge runtime to support custom API keys with createGoogleGenerativeAI

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const { chatId, messages: inputMessages, customApiKey } = body;
  if (!chatId || !Array.isArray(inputMessages)) return new Response('Missing chatId or messages', { status: 400 });
  // Ensure chat belongs to user
  const chat = await db.query.chats.findFirst({ where: (c, { eq, and }) => and(eq(c.id, chatId), eq(c.userId, userId)) });
  if (!chat) return new Response('Not found', { status: 404 });

  // Determine which model/provider to use
  let model;
  if (customApiKey) {
    // Use custom API key
    const customGoogle = createGoogleGenerativeAI({
      apiKey: customApiKey,
    });
    model = customGoogle('gemini-2.0-flash');
  } else {
    // Use default API key from environment
    model = google('gemini-2.0-flash');
  }

  // Call Gemini (or other AI) and stream the response
  const aiStream = await streamText({
    model,
    messages: inputMessages,
  });

  // Optionally, you can save the AI message to the DB here after streaming is done
  // (You may need to buffer the stream if you want to save the full response)

  return aiStream.toDataStreamResponse();
} 