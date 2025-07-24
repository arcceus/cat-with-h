'use client';

import { useHydrationState } from './DataHydrator';
import { Progress } from '@/components/ui/progress';
import { Bot, Database } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarImage } from '@radix-ui/react-avatar';

export default function HydrationLoader({ children }: { children: React.ReactNode }) {
  const { isHydrating, isComplete } = useHydrationState();
  const { isSignedIn, user, isLoaded } = useUser();
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Loading your chats...');

  // Debug logging
  useEffect(() => {
    console.log('🔄 HydrationLoader state:', { 
      isHydrating, 
      isComplete, 
      isSignedIn, 
      isLoaded,
      shouldShowLoader: isLoaded && isSignedIn && isHydrating && !isComplete
    });
  }, [isHydrating, isComplete, isSignedIn, isLoaded]);

  useEffect(() => {
    if (isHydrating) {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 300);

      // Update loading text
      const textInterval = setInterval(() => {
        setLoadingText(prev => {
          const texts = [
            'Loading your chats...',
            'Syncing canvases...',
            'Almost ready...'
          ];
          const currentIndex = texts.indexOf(prev);
          return texts[(currentIndex + 1) % texts.length];
        });
      }, 600);

      return () => {
        clearInterval(interval);
        clearInterval(textInterval);
      };
    } else if (isComplete) {
      setProgress(400);
    }
  }, [isHydrating, isComplete]);

  // Show children immediately if:
  // 1. User is not signed in (no need to hydrate)
  // 2. Clerk is not loaded yet (show app, DataHydrator will handle auth)
  // 3. Hydration is complete
  if (!isLoaded || !isSignedIn || isComplete) {
    return <>{children}</>;
  }

  // Show loader only if user is signed in and currently hydrating
  if (isLoaded && isSignedIn && isHydrating && !isComplete) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-6 max-w-md w-full px-8">
          {/* Logo/Icon */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {/* <Bot className="w-8 h-8 text-primary animate-pulse" /> */}
              <Avatar className="h-16 w-16 rounded-full">
                <AvatarImage className="rounded-full" src={user?.imageUrl} alt={user?.fullName || ""} />
              </Avatar>
            </div>
            
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Setting up your workspace
            </h2>
            <p className="text-sm text-muted-foreground animate-pulse">
              {loadingText}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full">
            <Progress value={progress} className="w-full h-2" />
            
          </div>

          {/* Additional Info */}
          {/* <p className="text-xs text-muted-foreground text-center">
            Loading your chats and canvases from the database...
          </p> */}
        </div>
      </div>
    );
  }

  // Default: show children without loader
  return <>{children}</>;
} 