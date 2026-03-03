import { useRouter } from "expo-router";
import { ScrollView, Text, View, Pressable } from "react-native";

import { Container } from "@/components/container";
import { SignUp } from "@/components/sign-up";

export default function SignUpScreen() {
  const router = useRouter();

  return (
    <Container>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        className="px-6"
      >
        <View className="mb-10">
          <Text className="text-3xl font-bold text-foreground mb-2">
            新規登録
          </Text>
          <Text className="text-sm text-muted">
            アカウントを作成してください
          </Text>
        </View>

        <SignUp />

        <View className="flex-row justify-center mt-6">
          <Text className="text-sm text-muted">すでにアカウントをお持ちの方は </Text>
          <Pressable onPress={() => router.push("/(auth)/sign-in")}>
            <Text className="text-sm text-primary font-semibold">
              ログイン
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Container>
  );
}
