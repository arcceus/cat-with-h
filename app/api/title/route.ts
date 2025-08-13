import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google('gemini-2.0-flash'),
      messages,
      prompt: 'You are a helpful assistant that can generate titles for blog posts.',
      maxTokens: 100,
      temperature: 0.5,
      topP: 1,
      topK: 40,
      frequencyPenalty: 0,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Error processing request', { status: 500 });
  }
}