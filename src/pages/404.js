
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, []);

  return <></>;
}
export default NotFound;
