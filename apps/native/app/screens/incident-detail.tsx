import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { orpc } from "@/utils/orpc";

const TIME_RANGE_LABELS: Record<string, string> = {
  MIDNIGHT: "深夜（0〜6時）",
  MORNING: "朝（6〜10時）",
  DAYTIME: "昼（10〜16時）",
  EVENING: "夕方（16〜20時）",
  NIGHT_EARLY: "夜（20〜22時）",
  NIGHT_LATE: "深夜前（22〜24時）",
};

type IncidentDetailParams = {
  postId?: string;
};

function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return target.toLocaleDateString("ja-JP");
}

export default function IncidentDetailScreen() {
  const params = useLocalSearchParams<IncidentDetailParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const postId = params.postId;

  const {
    data: response,
    isLoading,
    error,
  } = useQuery(
    orpc.incident.list.queryOptions({
      input: { limit: 50 },
    }),
  );

  const post = response?.items?.find((p) => p.id === postId);

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}
      >
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={{ marginTop: 16, color: "#6b7280" }}>読み込み中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          paddingHorizontal: 24,
        }}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#ea4335" />
        <Text style={{ marginTop: 16, color: "#ea4335", fontSize: 16 }}>エラーが発生しました</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            paddingHorizontal: 32,
            paddingVertical: 12,
            backgroundColor: "#1a73e8",
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>戻る</Text>
        </Pressable>
      </View>
    );
  }

  if (!post) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          paddingHorizontal: 24,
        }}
      >
        <Ionicons name="information-circle-outline" size={48} color="#9ca3af" />
        <Text style={{ marginTop: 16, color: "#374151", fontSize: 16 }}>投稿が見つかりません</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            paddingHorizontal: 32,
            paddingVertical: 12,
            backgroundColor: "#1a73e8",
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>戻る</Text>
        </Pressable>
      </View>
    );
  }

  const relativeTime = post.publishedAt ? getRelativeTime(post.publishedAt) : "未公開";
  const categories = post.incidentCategoryPosts.map((cp) => cp.incidentCategory);

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f9fa", paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#f3f4f6",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#3c4043" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827", flex: 1 }}>
          インシデント詳細
        </Text>
        <Pressable
          onPress={() =>
            router.push({ pathname: "/screens/report-guide", params: { postId: post.id } })
          }
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="flag-outline" size={20} color="#ea4335" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Time info */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 12,
                color: "#9ca3af",
                fontWeight: "600",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              時間帯
            </Text>
            <Text style={{ fontSize: 15, color: "#374151" }}>
              {TIME_RANGE_LABELS[post.timeRange] ?? post.timeRange}
            </Text>
            <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{relativeTime}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: "#f3f4f6", marginBottom: 16 }} />

          {/* Categories */}
          {categories.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                カテゴリ
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {categories.map((cat) => (
                  <View
                    key={cat.id}
                    style={{
                      backgroundColor: "#e8f0fe",
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#1a73e8", fontWeight: "500" }}>
                      {cat.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 1, backgroundColor: "#f3f4f6", marginBottom: 16 }} />

          {/* Description */}
          <View>
            <Text
              style={{
                fontSize: 12,
                color: "#9ca3af",
                fontWeight: "600",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              詳細
            </Text>
            <Text style={{ fontSize: 15, color: "#111827", lineHeight: 24 }}>
              {post.description}
            </Text>
          </View>
        </View>

        {/* Report button */}
        <Pressable
          onPress={() =>
            router.push({ pathname: "/screens/report-guide", params: { postId: post.id } })
          }
          style={{
            marginTop: 16,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 15, color: "#6b7280", fontWeight: "500" }}>
            この投稿を報告する
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 12, paddingVertical: 14, alignItems: "center" }}
        >
          <Text style={{ fontSize: 15, color: "#9ca3af" }}>戻る</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
