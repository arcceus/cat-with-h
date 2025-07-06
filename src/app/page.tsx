"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to default chat
    router.push('/chat/default-chat');
  }, [router]);

  return null;
}

export default HomePage;