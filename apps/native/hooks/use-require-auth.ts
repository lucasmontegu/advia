// apps/native/hooks/use-require-auth.ts
import { useRouter } from 'expo-router';
import { authClient } from '@/lib/auth-client';

export function useRequireAuth() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const requireAuth = (callback: () => void) => {
    if (session?.user) {
      callback();
    } else {
      router.push('/(app)/login-incentive');
    }
  };

  const isAuthenticated = !!session?.user;

  return { requireAuth, isAuthenticated, session };
}
