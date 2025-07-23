'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useCanvasStore } from '@/store/canvasStore';
import { toast } from 'sonner';

// Create a context for hydration state
const HydrationContext = createContext({
  isHydrating: false,
  isComplete: false
});

export function useHydrationState() {
  return useContext(HydrationContext);
}

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const [isHydrating, setIsHydrating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  return (
    <HydrationContext.Provider value={{ isHydrating, isComplete }}>
      <DataHydratorInternal setIsHydrating={setIsHydrating} setIsComplete={setIsComplete} />
      {children}
    </HydrationContext.Provider>
  );
}

function DataHydratorInternal({ 
  setIsHydrating, 
  setIsComplete 
}: { 
  setIsHydrating: (value: boolean) => void;
  setIsComplete: (value: boolean) => void;
}) {
  const { isSignedIn, isLoaded } = useUser();
  const hydratedRef = useRef(false);
  
  const hydrateChats = useChatStore(state => state.hydrateFromServer);
  const hydrateCanvases = useCanvasStore(state => state.hydrateFromServer);

  useEffect(() => {
    // Only hydrate once when user is signed in and Clerk is loaded
    if (isLoaded && isSignedIn && !hydratedRef.current) {
      hydratedRef.current = true;
      
      console.log('🔄 Starting data hydration...');
      setIsHydrating(true);
      setIsComplete(false);
      
      // Fallback timeout to ensure hydration completes even if there are errors
      const fallbackTimeout = setTimeout(() => {
        console.log('⏰ Hydration timeout - marking as complete');
        setIsHydrating(false);
        setIsComplete(true);
      }, 10000); // 10 second timeout
      
      // Add a small delay to ensure Zustand has finished loading from localStorage
      setTimeout(() => {
        // Clear any existing state to ensure fresh data
        console.log('🧹 Clearing existing state before hydration...');
        
        // Hydrate both stores in parallel
        Promise.all([
          hydrateChats((error) => {
            console.error('❌ Failed to sync chats:', error);
            toast.error('Failed to sync chats from server');
          }),
          hydrateCanvases((error) => {
            console.error('❌ Failed to sync canvases:', error);
            toast.error('Failed to sync canvases from server');
          })
        ]).then(() => {
          console.log('✅ Successfully hydrated data from server');
          
          // Debug: Check what's in the stores after hydration
          const chatState = useChatStore.getState();
          const canvasState = useCanvasStore.getState();
          console.log('📊 Chat store after hydration:', {
            chatsCount: chatState.chats.length,
            activeChatId: chatState.activeChatId,
            pinnedCount: Object.keys(chatState.pinned).length,
            chats: chatState.chats.map(c => ({ id: c.chatId, title: c.title, messageCount: c.messages.length }))
          });
          console.log('📊 Canvas store after hydration:', {
            canvasesCount: Object.keys(canvasState.canvases).length,
            currentKey: canvasState.currentKey
          });
          
          // Force a re-render by triggering a state update
          setTimeout(() => {
            const currentChatState = useChatStore.getState();
            if (currentChatState.chats.length > 0 && !currentChatState.activeChatId) {
              // Set active chat to first chat if none is active
              useChatStore.getState().setActiveChat(currentChatState.chats[0].chatId);
              console.log('🎯 Set active chat to:', currentChatState.chats[0].chatId);
            }
            
            // Mark hydration as complete and clear timeout
            clearTimeout(fallbackTimeout);
            setIsHydrating(false);
            setIsComplete(true);
            console.log('🏁 Hydration complete - hiding loader');
          }, 100);
        }).catch((error) => {
          console.error('❌ Hydration failed:', error);
          clearTimeout(fallbackTimeout);
          setIsHydrating(false);
          setIsComplete(true);
        });
      }, 100);
    }
  }, [isLoaded, isSignedIn, hydrateChats, hydrateCanvases, setIsHydrating, setIsComplete]);

  // Reset hydration flag when user signs out
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      hydratedRef.current = false;
      setIsHydrating(false);
      setIsComplete(false);
      console.log('🔄 User signed out, resetting hydration flag');
    }
  }, [isLoaded, isSignedIn, setIsHydrating, setIsComplete]);

  return null; // This component doesn't render anything
}

// Keep the old export for backward compatibility
export default function DataHydrator() {
  return null;
} 