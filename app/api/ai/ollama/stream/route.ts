import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/drizzle/db';

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  
  const { chatId, messages: inputMessages } = body;
  if (!chatId || !Array.isArray(inputMessages)) return new Response('Missing chatId or messages', { status: 400 });
  
  // Ensure chat belongs to user
  const chat = await db.query.chats.findFirst({ where: (c, { eq, and }) => and(eq(c.id, chatId), eq(c.userId, userId)) });
  if (!chat) return new Response('Not found', { status: 404 });

  try {
    console.log('Calling Ollama API with messages:', inputMessages);
    
    // Call Ollama API directly with streaming
    const response = await fetch('http://natural-markets.gl.at.ply.gg:28881/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-oss:20b',
        messages: inputMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    // Create AI SDK compatible stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.error(new Error('No reader available'));
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  // AI SDK data stream format
                  const formatted = `0:${JSON.stringify(data.message.content)}\n`;
                  controller.enqueue(new TextEncoder().encode(formatted));
                }
                
                if (data.done) {
                  controller.close();
                  return;
                }
              } catch (parseError) {
                console.log('Skipping invalid JSON line:', line);
              }
            }
          }
        } catch (error) {
          console.error('Stream reading error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Stream error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}