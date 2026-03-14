import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { orpc, queryClient as globalQueryClient } from "@/utils/orpc";

const TIME_RANGE_LABELS: Record<string, string> = {
  MIDNIGHT: "深夜 0:00〜6:00",
  MORNING: "朝 6:00〜10:00",
  DAYTIME: "昼間 10:00〜16:00",
  EVENING: "夕方 16:00〜20:00",
  NIGHT_EARLY: "夜 20:00〜22:00",
  NIGHT_LATE: "深夜 22:00〜24:00",
};

export default function ModerationQueueScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    data: pendingPosts,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery(orpc.moderation.listPending.queryOptions());

  const approveMutation = useMutation(
    orpc.moderation.approve.mutationOptions({
      onSuccess: () => {
        globalQueryClient.invalidateQueries(orpc.moderation.listPending.queryOptions());
      },
    }),
  );

  const rejectMutation = useMutation(
    orpc.moderation.reject.mutationOptions({
      onSuccess: () => {
        globalQueryClient.invalidateQueries(orpc.moderation.listPending.queryOptions());
      },
    }),
  );

  const banMutation = useMutation(
    orpc.moderation.banUser.mutationOptions({
      onSuccess: () => {
        globalQueryClient.invalidateQueries(orpc.moderation.listPending.queryOptions());
        Alert.alert("完了", "ユーザーをBANしました");
      },
      onError: (error) => {
        Alert.alert("エラー", error.message ?? "BANに失敗しました");
      },
    }),
  );

  const handleApprove = (postId: string) => {
    Alert.alert("承認確認", "この投稿を公開しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "承認",
        onPress: () => approveMutation.mutate({ postId }),
      },
    ]);
  };

  const handleReject = (postId: string) => {
    Alert.alert("却下確認", "この投稿を非表示にしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "却下",
        style: "destructive",
        onPress: () => rejectMutation.mutate({ postId }),
      },
    ]);
  };

  const handleBan = (userId: string) => {
    Alert.prompt(
      "BAN理由を入力",
      "このユーザーをBANする理由を入力してください",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "BAN実行",
          style: "destructive",
          onPress: (reason: string | undefined) => {
            if (!reason || reason.trim().length === 0) {
              Alert.alert("エラー", "理由を入力してください");
              return;
            }
            banMutation.mutate({ userId, reason: reason.trim() });
          },
        },
      ],
      "plain-text",
      "",
    );
  };

  return (
    <View className="flex-1 bg-[#f8f9fa]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full items-center justify-center mr-3"
        >
          <Ionicons name="arrow-back" size={22} color="#3c4043" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-800 flex-1">モデレーションキュー</Text>
        {isLoading || isRefetching ? (
          <ActivityIndicator size="small" color="#1a73e8" />
        ) : (
          <View className="bg-[#1a73e8] rounded-full px-3 py-1">
            <Text className="text-white text-xs font-bold">{pendingPosts?.length ?? 0} 件</Text>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1a73e8" />
        }
      >
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#1a73e8" />
            <Text className="text-gray-400 mt-3">読み込み中...</Text>
          </View>
        ) : pendingPosts?.length === 0 ? (
          <View className="py-16 items-center">
            <Ionicons name="checkmark-circle" size={48} color="#34a853" />
            <Text className="text-gray-600 text-base font-semibold mt-4">
              審査待ちの投稿はありません
            </Text>
            <Text className="text-gray-400 text-sm mt-1">すべての投稿が処理されました</Text>
          </View>
        ) : (
          pendingPosts?.map((post) => (
            <View key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Post metadata */}
              <View className="px-5 pt-5 pb-3">
                <View className="flex-row items-center mb-2">
                  <View className="flex-row flex-wrap gap-1 flex-1">
                    {post.incidentCategoryPosts.map(({ incidentCategory: cat }) => (
                      <View key={cat.id} className="rounded-full px-2 py-0.5 bg-[#e8f0fe]">
                        <Text className="text-xs font-medium text-[#1a73e8]">{cat.name}</Text>
                      </View>
                    ))}
                  </View>
                  <Text className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>

                <Text className="text-sm text-gray-500 mb-2">
                  {TIME_RANGE_LABELS[post.timeRange] ?? post.timeRange}
                </Text>

                <Text className="text-base text-gray-800 leading-relaxed">{post.description}</Text>

                <Text className="text-xs text-gray-400 mt-2">メッシュ: {post.meshCode}</Text>
              </View>

              {/* Actions */}
              <View className="border-t border-gray-100 flex-row">
                <Pressable
                  onPress={() => handleApprove(post.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex-1 py-3 flex-row items-center justify-center gap-2 active:bg-green-50"
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#34a853" />
                  <Text className="text-sm font-semibold text-[#34a853]">承認</Text>
                </Pressable>

                <View className="w-px bg-gray-100" />

                <Pressable
                  onPress={() => handleReject(post.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex-1 py-3 flex-row items-center justify-center gap-2 active:bg-orange-50"
                >
                  <Ionicons name="close-circle-outline" size={18} color="#fa7b17" />
                  <Text className="text-sm font-semibold text-[#fa7b17]">却下</Text>
                </Pressable>

                <View className="w-px bg-gray-100" />

                <Pressable
                  onPress={() => handleBan(post.userId)}
                  disabled={banMutation.isPending}
                  className="flex-1 py-3 flex-row items-center justify-center gap-2 active:bg-red-50"
                >
                  <Ionicons name="ban-outline" size={18} color="#ea4335" />
                  <Text className="text-sm font-semibold text-[#ea4335]">BAN</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
