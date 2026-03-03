import { useEffect, useState } from 'react';
import useAuthStore from '@/store/authStore';

export function useAuthGuard() {
  const { token, user, fetchCurrent } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const syncUser = async () => {
      if (token && !user) {
        await fetchCurrent();
      }
      if (active) setChecking(false);
    };
    syncUser();
    return () => {
      active = false;
    };
  }, [token, user, fetchCurrent]);

  return { token, user, checking };
}
