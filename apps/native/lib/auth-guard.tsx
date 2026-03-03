import { useRouter } from "expo-router";
import { useEffect } from "react";

import { authClient } from "./auth-client";

export type UseAuthGuardResult = {
  session: ReturnType<typeof authClient.useSession>["data"];
  isLoading: boolean;
};

/**
 * Hook to guard authenticated routes
 * Redirects to /sign-in if user is not authenticated
 */
export function useAuthGuard(): UseAuthGuardResult {
  const router = useRouter();
  const { data: session, isPending: isLoading } = authClient.useSession();

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.replace("/(auth)/sign-in");
    }
  }, [session?.user, isLoading, router]);

  return {
    session,
    isLoading,
  };
}

/**
 * HOC to wrap a component with auth guard
 */
export function withAuthGuard<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
): React.ComponentType<T> {
  return function AuthGuardedComponent(props: T) {
    const { session, isLoading } = useAuthGuard();

    if (isLoading || !session?.user) {
      return null;
    }

    return <Component {...props} />;
  };
}
