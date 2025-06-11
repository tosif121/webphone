import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const parsedToken = token ? JSON.parse(token) : null;

    if (parsedToken) {
      router.replace('/webphone');
    } else {
      router.replace('/webphone/login');
    }
  }, []);

  return null; // Or spinner
}
