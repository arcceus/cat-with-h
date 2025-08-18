'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chatStore';

export default function TestOllamaPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { chats } = useChatStore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Get the first chat ID when component mounts
  useEffect(() => {
    if (chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].chatId);
    }
  }, [chats, selectedChatId]);

  const testOllamaRoute = async () => {
    if (!selectedChatId) {
      setError('No chat selected. Please create a chat first.');
      return;
    }

    setStatus('loading');
    setResponse('');
    setError(null);

    try {
      const requestBody = {
        chatId: selectedChatId,
        messages: [
          { role: 'user', content: 'Hello, can you tell me a short joke?' }
        ]
      };

      const response = await fetch('/api/ai/ollama/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      setStatus('success');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        setResponse(prev => prev + chunk);
      }
    } catch (error) {
      console.error('Test error:', error);
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ollama API Route Test</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Select Chat:</label>
        <select 
          className="w-full p-2 border rounded"
          value={selectedChatId || ''}
          onChange={(e) => setSelectedChatId(e.target.value)}
        >
          <option value="">-- Select a chat --</option>
          {chats.map(chat => (
            <option key={chat.chatId} value={chat.chatId}>
              {chat.title} ({chat.chatId})
            </option>
          ))}
        </select>
      </div>

      <Button 
        onClick={testOllamaRoute}
        disabled={status === 'loading' || !selectedChatId}
        className="mb-4"
      >
        {status === 'loading' ? 'Testing...' : 'Test Ollama Route'}
      </Button>

      {status === 'loading' && (
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <p>Loading...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
          <h2 className="font-bold">Error:</h2>
          <p>{error}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="mb-4">
          <h2 className="font-bold mb-2">Response:</h2>
          <div className="p-4 bg-gray-50 rounded whitespace-pre-wrap font-mono text-sm max-h-96 overflow-auto">
            {response || 'No response data received'}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h2 className="font-bold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside">
          <li>Make sure your Next.js server is running</li>
          <li>Select a chat from the dropdown</li>
          <li>Click the "Test Ollama Route" button</li>
          <li>Check the response below</li>
        </ol>
      </div>
    </div>
  );
}
