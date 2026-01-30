import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AgentDashboard from '@/components/AgentDashboard';

export default function AgentDashboardPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Redirect to main page on mobile - Agent Dashboard is a mobile tab only
    if (isMobile) {
      router.replace('/webphone/v1');
    }
  }, [isMobile, router]);

  // Show Agent Dashboard on desktop
  if (isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return <AgentDashboard />;
}
