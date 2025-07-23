import { NextRequest, NextResponse } from 'next/server';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Test the API key by making a simple request using ai-sdk
    const customGoogle = createGoogleGenerativeAI({
      apiKey: apiKey,
    });
    
    const model = customGoogle('gemini-2.0-flash');
    
    // Make a minimal request to validate the key
    const result = await generateText({
      model,
      prompt: "Hi",
      maxTokens: 5,
    });
    
    // If we get here, the API key is valid
    return NextResponse.json({ valid: true });
    
  } catch (error: any) {
    console.error('API key validation error:', error);
    
    // Check for specific Google API errors
    if (error.message?.includes('API_KEY_INVALID') || 
        error.message?.includes('Invalid API key') ||
        error.message?.includes('403') ||
        error.status === 400 || 
        error.status === 403) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
    }
    
    if (error.message?.includes('quota') || error.status === 429) {
      return NextResponse.json({ error: 'API quota exceeded' }, { status: 429 });
    }
    
    // For other errors, assume the key might be valid but there's another issue
    return NextResponse.json({ error: 'Could not validate API key' }, { status: 500 });
  }
} 