import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { Stack, useRouter, useSegments } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { ONBOARDING_COMPLETED_KEY } from "./screens/onboarding";
import { queryClient } from "@/utils/orpc";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

function AuthRedirect() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const segments = useSegments();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY).then((val) => {
      setHasOnboarded(val === "true");
    });
  }, []);

  useEffect(() => {
    if (isPending || hasOnboarded === null) return;

    const inOnboarding = segments[0] === "screens" && segments[1] === "onboarding";
    const inAuthGroup = segments[0] === "(auth)";

    if (!hasOnboarded && !inOnboarding) {
      router.replace("/screens/onboarding");
    } else if (hasOnboarded && !session?.user && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (hasOnboarded && session?.user && inAuthGroup) {
      router.replace("/(tabs)/map");
    }
  }, [session?.user, isPending, hasOnboarded, segments]);

  return null;
}

function StackLayout() {
  return (
    <>
      <AuthRedirect />
      <Stack screenOptions={{}}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ title: "Modal", presentation: "modal" }} />
        <Stack.Screen name="screens/onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="screens/terms-of-service" options={{ title: "利用規約" }} />
        <Stack.Screen name="screens/privacy-policy" options={{ title: "プライバシーポリシー" }} />
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
