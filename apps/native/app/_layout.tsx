import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/orpc";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

function AuthRedirect() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isPending) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session?.user && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (session?.user && inAuthGroup) {
      router.replace("/(drawer)");
    }
  }, [session?.user, isPending]);

  return null;
}

function StackLayout() {
  return (
    <>
      <AuthRedirect />
      <Stack screenOptions={{}}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ title: "Modal", presentation: "modal" }} />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AppThemeProvider>
            <HeroUINativeProvider>
              <StackLayout />
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
