'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chatStore';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TestModelsPage() {
  const [status, setStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({
    gemini: 'idle',
    ollama: 'idle'
  });
  const [responses, setResponses] = useState<Record<string, string>>({
    gemini: '',
    ollama: ''
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({
    gemini: null,
    ollama: null
  });
  const { chats } = useChatStore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState<string>('Hello, can you tell me a short joke?');

  // Get the first chat ID when component mounts
  useEffect(() => {
    if (chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].chatId);
    }
  }, [chats, selectedChatId]);

  const testModel = async (model: 'gemini' | 'ollama') => {
    if (!selectedChatId) {
      setErrors(prev => ({ ...prev, [model]: 'No chat selected. Please create a chat first.' }));
      return;
    }

    setStatus(prev => ({ ...prev, [model]: 'loading' }));
    setResponses(prev => ({ ...prev, [model]: '' }));
    setErrors(prev => ({ ...prev, [model]: null }));

    const apiUrl = model === 'gemini' ? '/api/ai/stream' : '/api/ai/ollama/stream';

    try {
      const requestBody = {
        chatId: selectedChatId,
        messages: [
          { role: 'user', content: testPrompt }
        ]
      };

      const response = await fetch(apiUrl, {
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
      setStatus(prev => ({ ...prev, [model]: 'success' }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        setResponses(prev => ({ 
          ...prev, 
          [model]: prev[model] + chunk 
        }));
      }
    } catch (error) {
      console.error(`Test error (${model}):`, error);
      setStatus(prev => ({ ...prev, [model]: 'error' }));
      setErrors(prev => ({ 
        ...prev, 
        [model]: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  };

  const testBothModels = () => {
    testModel('gemini');
    testModel('ollama');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Model API Routes Test</h1>
      
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

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Test Prompt:</label>
        <textarea
          className="w-full p-2 border rounded"
          value={testPrompt}
          onChange={(e) => setTestPrompt(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-2 mb-4">
        <Button 
          onClick={() => testModel('gemini')}
          disabled={status.gemini === 'loading' || !selectedChatId}
          variant="outline"
        >
          {status.gemini === 'loading' ? 'Testing...' : 'Test Gemini'}
        </Button>
        
        <Button 
          onClick={() => testModel('ollama')}
          disabled={status.ollama === 'loading' || !selectedChatId}
          variant="outline"
        >
          {status.ollama === 'loading' ? 'Testing...' : 'Test Ollama'}
        </Button>
        
        <Button 
          onClick={testBothModels}
          disabled={status.gemini === 'loading' || status.ollama === 'loading' || !selectedChatId}
        >
          Test Both Models
        </Button>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded p-4">
            <h2 className="font-bold mb-2">Gemini Response:</h2>
            {status.gemini === 'loading' && <p>Loading...</p>}
            {errors.gemini && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
                <p>{errors.gemini}</p>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded whitespace-pre-wrap font-mono text-sm max-h-96 overflow-auto">
              {responses.gemini || 'No response data received'}
            </div>
          </div>
          
          <div className="border rounded p-4">
            <h2 className="font-bold mb-2">Ollama Response:</h2>
            {status.ollama === 'loading' && <p>Loading...</p>}
            {errors.ollama && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
                <p>{errors.ollama}</p>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded whitespace-pre-wrap font-mono text-sm max-h-96 overflow-auto">
              {responses.ollama || 'No response data received'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h2 className="font-bold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside">
          <li>Make sure your Next.js server is running</li>
          <li>Select a chat from the dropdown</li>
          <li>Enter a test prompt or use the default</li>
          <li>Click on one of the test buttons</li>
          <li>View the responses in the tabs below</li>
        </ol>
      </div>
    </div>
  );
}
