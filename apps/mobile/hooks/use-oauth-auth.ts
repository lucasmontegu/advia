// apps/mobile/hooks/use-oauth-auth.ts
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { authClient } from '@/lib/auth-client';
import { useTrialStore } from '@/stores/trial-store';
import { Analytics, identifyUser } from '@/lib/analytics';
import { queryClient } from '@/lib/query-client';

type AuthMethod = 'google' | 'apple';

interface UseOAuthAuthOptions {
  /** Where to navigate after successful auth */
  onSuccess?: () => void;
  /** Whether to navigate to home after auth (default: true) */
  navigateToHome?: boolean;
}

/**
 * Hook that handles OAuth authentication flow including:
 * - Detecting when session changes after OAuth redirect
 * - Starting trial for new users
 * - Analytics tracking
 * - Query invalidation
 * - Navigation after auth
 */
export function useOAuthAuth(options: UseOAuthAuthOptions = {}) {
  const { onSuccess, navigateToHome = true } = options;
  const router = useRouter();
  const { startTrial, trialStartDate } = useTrialStore();
  const { data: session } = authClient.useSession();
  const pendingAuthMethod = useRef<AuthMethod | null>(null);
  const hasHandledAuth = useRef(false);

  // Handle successful OAuth authentication
  useEffect(() => {
    if (session?.user && pendingAuthMethod.current && !hasHandledAuth.current) {
      hasHandledAuth.current = true;
      const method = pendingAuthMethod.current;

      // Start trial for new users
      const isNewUser = !trialStartDate;
      if (isNewUser) {
        startTrial();
        Analytics.signUp(method);
      } else {
        Analytics.signIn(method);
      }

      // Identify user for analytics
      identifyUser(session.user.id, {
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      });

      // Invalidate queries and handle navigation
      queryClient.invalidateQueries().then(() => {
        if (onSuccess) {
          onSuccess();
        } else if (navigateToHome) {
          router.replace('/(app)/(tabs)');
        }
      });
    }
  }, [session, trialStartDate, startTrial, router, onSuccess, navigateToHome]);

  const signInWithGoogle = useCallback(async () => {
    pendingAuthMethod.current = 'google';
    hasHandledAuth.current = false;
    try {
      await authClient.signIn.social({ provider: 'google' });
      // The useEffect above will handle the rest when session updates
    } catch (error) {
      console.error('Google sign-in error:', error);
      Analytics.errorOccurred('google_sign_in_failed', String(error));
      pendingAuthMethod.current = null;
      throw error;
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    pendingAuthMethod.current = 'apple';
    hasHandledAuth.current = false;
    try {
      await authClient.signIn.social({ provider: 'apple' });
      // The useEffect above will handle the rest when session updates
    } catch (error) {
      console.error('Apple sign-in error:', error);
      Analytics.errorOccurred('apple_sign_in_failed', String(error));
      pendingAuthMethod.current = null;
      throw error;
    }
  }, []);

  return {
    signInWithGoogle,
    signInWithApple,
    session,
  };
}
