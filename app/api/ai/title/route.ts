import { NextRequest } from 'next/server';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

// Removed edge runtime to support custom API keys with createGoogleGenerativeAI

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const { userMessage, aiResponse, customApiKey } = body;
  if (!userMessage) return new Response('Missing userMessage', { status: 400 });

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

  // Prompt for a short, relevant chat title
  const prompt = [
    { role: 'system' as const, content: 'You are a helpful assistant. Given a user message (and optionally an AI response), generate a short, relevant chat title (max 5 words, no punctuation, no quotes, no greeting, no period, no emojis). Return only the title.' },
    { role: 'user' as const, content: `User: ${userMessage}${aiResponse ? `\nAI: ${aiResponse}` : ''}` }
  ];

  const result = await streamText({
    model,
    messages: prompt,
    maxTokens: 20,
  });

  const text = await result.text;
  return Response.json({ title: text.trim() });
} 