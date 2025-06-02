import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

function index() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    router.push('/webphone');
  }, [router]);

  if (!mounted) {
    return null;
  }
  return <div></div>;
}

export default index;
