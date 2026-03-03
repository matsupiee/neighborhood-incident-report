import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Text, View, Pressable } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";

export default function SignInScreen() {
  const router = useRouter();

  return (
    <Container>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        className="px-6"
      >
        <View className="mb-10">
          <Text className="text-3xl font-bold text-foreground mb-2">
            ログイン
          </Text>
        </View>

        <SignIn />

        <View className="flex-row justify-center mt-6">
          <Text className="text-sm text-muted">
            アカウントをお持ちでない方は{" "}
          </Text>
          <Pressable onPress={() => router.push("/(auth)/sign-up")}>
            <Text className="text-sm text-primary font-semibold">新規登録</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
