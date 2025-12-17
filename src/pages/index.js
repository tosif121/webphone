import { useEffect } from 'react';
import MobileTabsWrapper from '@/components/MobileTabsWrapper';

export default function Home() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/mobile/login';
    }
  }, []);

  return <MobileTabsWrapper />;
}