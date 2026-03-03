import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Button, Card, Separator, Surface, useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";

import { Container } from "@/components/container";
import { useAuthGuard } from "@/lib/auth-guard";
import { orpc, queryClient } from "@/utils/orpc";

// Abuse report reason to Japanese label mapping
const ABUSE_REASON_OPTIONS = [
  { value: "PERSONAL_INFO", label: "個人情報が含まれる" },
  { value: "FALSE_REPORT", label: "虚偽・誇張の通報" },
  { value: "HARASSMENT", label: "嫌がらせ目的" },
  { value: "OTHER", label: "その他" },
];

type ReportGuideParams = {
  postId?: string;
};

export default function ReportGuideScreen() {
  const params = useLocalSearchParams<ReportGuideParams>();
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuthGuard();
  const postId = params.postId as string | undefined;
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const successColor = useThemeColor("success");

  // Report abuse mutation
  const reportMutation = useMutation(
    orpc.incident.reportAbuse.mutationOptions({
      onSuccess: () => {
        setIsSubmitted(true);
        setTimeout(() => {
          queryClient.invalidateQueries();
          router.back();
        }, 2000);
      },
      onError: (error) => {
        console.error("Failed to report abuse:", error);
        Alert.alert("エラー", "通報に失敗しました");
      },
    }),
  );

  if (authLoading) {
    return (
      <Container className="items-center justify-center">
        <ActivityIndicator size="large" color={foregroundColor} />
      </Container>
    );
  }

  if (!session?.user || !postId) {
    return (
      <Container className="items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color={mutedColor} />
        <Text className="mt-4 text-foreground text-base">
          エラーが発生しました
        </Text>
        <Button
          variant="primary"
          onPress={() => router.back()}
          className="mt-6 px-8"
          size="lg"
        >
          戻る
        </Button>
      </Container>
    );
  }

  if (isSubmitted) {
    return (
      <Container className="items-center justify-center">
        <View className="items-center gap-4">
          <Ionicons name="checkmark-circle" size={64} color={successColor} />
          <Text className="text-xl font-semibold text-foreground text-center">
            通報を受け付けました
          </Text>
          <Text className="text-sm text-muted text-center">
            ご報告ありがとうございます
          </Text>
        </View>
      </Container>
    );
  }

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert("選択してください", "通報理由を選択してください");
      return;
    }

    reportMutation.mutate({
      postId,
      reason: selectedReason as
        | "PERSONAL_INFO"
        | "FALSE_REPORT"
        | "HARASSMENT"
        | "OTHER",
    });
  };

  return (
    <Container>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        className="p-4"
      >
        <Card className="mb-6 p-4">
          <Card.Header className="pb-3">
            <Text className="text-lg font-semibold text-foreground">
              投稿を報告する
            </Text>
          </Card.Header>
          <Separator className="my-3" />
          <Text className="text-sm text-muted leading-6 mb-4">
            不適切な投稿を報告してください。スパムや不適切なコンテンツは削除されます。
          </Text>
        </Card>

        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-3">
            通報理由を選択してください
          </Text>
          <View className="gap-2">
            {ABUSE_REASON_OPTIONS.map((option) => (
              <Surface
                key={option.value}
                variant="secondary"
                className={`p-4 rounded-lg border-2 ${
                  selectedReason === option.value
                    ? "border-primary bg-primary/10"
                    : "border-muted bg-muted/5"
                }`}
              >
                <Pressable
                  onPress={() => setSelectedReason(option.value)}
                  className="flex-row items-center gap-3"
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      selectedReason === option.value
                        ? "border-primary bg-primary"
                        : "border-muted"
                    }`}
                  >
                    {selectedReason === option.value && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                  <Text
                    className={`flex-1 text-base ${
                      selectedReason === option.value
                        ? "text-foreground font-semibold"
                        : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              </Surface>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Button
            variant="danger"
            size="lg"
            isDisabled={!selectedReason || reportMutation.isPending}
            onPress={handleSubmit}
            className="w-full"
          >
            {reportMutation.isPending ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="white" />
                <Text>送信中...</Text>
              </View>
            ) : (
              "報告する"
            )}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            isDisabled={reportMutation.isPending}
            onPress={() => router.back()}
            className="w-full"
          >
            キャンセル
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
}
