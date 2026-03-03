import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Chip, Spinner, useThemeColor } from "heroui-native";
import { Text, View, ScrollView, Alert } from "react-native";

import { Container } from "@/components/container";
import { orpc } from "@/utils/orpc";

// TimeRange to Japanese label mapping
const TIME_RANGE_LABELS: Record<string, string> = {
  MIDNIGHT: "深夜（0〜6時）",
  MORNING: "朝（6〜10時）",
  DAYTIME: "昼（10〜16時）",
  EVENING: "夕方（16〜20時）",
  NIGHT_EARLY: "夜（20〜22時）",
  NIGHT_LATE: "深夜前（22〜24時）",
};

// Abuse report reason to Japanese label mapping
const ABUSE_REASON_LABELS: Record<string, string> = {
  PERSONAL_INFO: "個人情報が含まれる",
  FALSE_REPORT: "虚偽・誇張の通報",
  HARASSMENT: "嫌がらせ目的",
  OTHER: "その他",
};

type IncidentDetailParams = {
  postId?: string;
};

type IncidentPost = {
  id: string;
  meshCode: string;
  description: string;
  timeRange: string;
  status: string;
  publishedAt: string | null;
  incidentCategoryPosts: Array<{
    incidentCategory: {
      id: string;
      name: string;
    };
  }>;
};

/**
 * Calculates relative time display (e.g., "2時間前")
 */
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "今";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return date.toLocaleDateString("ja-JP");
  }
}

export default function IncidentDetailScreen() {
  const params = useLocalSearchParams<IncidentDetailParams>();
  const router = useRouter();
  const postId = params.postId as string | undefined;

  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const dangerColor = useThemeColor("danger");

  // Fetch incidents list to find the detail
  const {
    data: response,
    isLoading,
    error,
  } = useQuery(
    orpc.incident.list.queryOptions({
      limit: 50,
    }),
  );

  const post = response?.items?.find((p: IncidentPost) => p.id === postId) as
    | IncidentPost
    | undefined;

  if (isLoading) {
    return (
      <Container className="items-center justify-center">
        <Spinner size="lg" />
        <Text className="mt-4 text-foreground text-base">読み込み中...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color={dangerColor} />
        <Text className="mt-4 text-danger text-base">エラーが発生しました</Text>
        <Button
          color="primary"
          onPress={() => router.back()}
          className="mt-6 px-8"
          size="lg"
        >
          戻る
        </Button>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container className="items-center justify-center">
        <Ionicons
          name="information-circle-outline"
          size={48}
          color={mutedColor}
        />
        <Text className="mt-4 text-foreground text-base">
          投稿が見つかりません
        </Text>
        <Button
          color="primary"
          onPress={() => router.back()}
          className="mt-6 px-8"
          size="lg"
        >
          戻る
        </Button>
      </Container>
    );
  }

  const relativeTime = post.publishedAt
    ? getRelativeTime(post.publishedAt)
    : "未公開";
  const categories = post.incidentCategoryPosts.map(
    (cp) => cp.incidentCategory,
  );

  return (
    <Container>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        className="p-4"
      >
        <Card className="mb-4 p-4">
          <Card.Header className="pb-3 flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-sm text-muted mb-1">
                {TIME_RANGE_LABELS[post.timeRange] || post.timeRange}
              </Text>
              <Text className="text-xs text-muted">{relativeTime}</Text>
            </View>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => {
                router.push({
                  pathname: "/screens/report-guide",
                  params: { postId: post.id },
                });
              }}
            >
              <Ionicons name="flag-outline" size={20} color={dangerColor} />
            </Button>
          </Card.Header>

          <Card.Divider className="my-3" />

          {categories.length > 0 && (
            <View className="mb-4">
              <Text className="text-foreground text-xs font-semibold mb-2">
                カテゴリ
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.map((category) => (
                  <Chip key={category.id} variant="secondary" size="sm">
                    <Chip.Label>{category.name}</Chip.Label>
                  </Chip>
                ))}
              </View>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-foreground text-xs font-semibold mb-2">
              詳細
            </Text>
            <Text className="text-foreground text-sm leading-6">
              {post.description}
            </Text>
          </View>

          <Card.Divider className="my-3" />

          <View className="flex-row items-center justify-between">
            <Text className="text-muted text-xs">
              ステータス: {post.status}
            </Text>
          </View>
        </Card>

        <Button
          color="danger"
          variant="bordered"
          fullWidth
          onPress={() => {
            router.push({
              pathname: "/screens/report-guide",
              params: { postId: post.id },
            });
          }}
          className="mb-4"
        >
          この投稿を報告する
        </Button>

        <Button variant="light" fullWidth onPress={() => router.back()}>
          戻る
        </Button>
      </ScrollView>
    </Container>
  );
}
