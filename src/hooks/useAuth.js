import { useCallback, useEffect, useState } from 'react';
import { getStoredTokenPayload } from '@/utils/agent-preferences';

export function useAuth() {
  const [authState, setAuthState] = useState(() => getStoredTokenPayload());

  const refreshAuth = useCallback(() => {
    setAuthState(getStoredTokenPayload());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorage = (event) => {
      if (!event?.key || event.key === 'token') {
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', refreshAuth);
    window.addEventListener('auth-token-updated', refreshAuth);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', refreshAuth);
      window.removeEventListener('auth-token-updated', refreshAuth);
    };
  }, [refreshAuth]);

  return {
    auth: authState,
    token: authState?.token || authState?.accessToken || '',
    user: authState?.userData || null,
    refreshAuth,
  };
}

export default useAuth;
