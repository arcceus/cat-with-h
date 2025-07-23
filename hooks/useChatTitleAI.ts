import { useState } from 'react';

export function useChatTitleAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateChatTitle(userMessage: string, aiResponse?: string): Promise<string | null> {
    console.log('🎯 Generating AI title for:', { userMessage: userMessage.substring(0, 50), aiResponse: aiResponse?.substring(0, 50) });
    setLoading(true);
    setError(null);
    try {
      // Get custom API key from localStorage if available
      const customApiKey = localStorage.getItem('custom-gemini-api-key');
      
      const res = await fetch('/api/ai/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userMessage, 
          aiResponse, 
          customApiKey: customApiKey || undefined 
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to generate title: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      console.log('✅ AI title generated:', data.title);
      setLoading(false);
      return data.title || null;
    } catch (e: any) {
      console.error('❌ AI title generation failed:', e);
      setError(e.message || 'Unknown error');
      setLoading(false);
      return null;
    }
  }

  return { generateChatTitle, loading, error };
} 