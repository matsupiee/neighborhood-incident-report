import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authClient } from "@/lib/auth-client";
import { queryClient, orpc } from "@/utils/orpc";

type MenuItemProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  isDestructive?: boolean;
};

function MenuItem({ icon, label, value, onPress, isDestructive }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-4 active:bg-gray-50"
    >
      <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center mr-4">
        <Ionicons
          name={icon}
          size={18}
          color={isDestructive ? "#ea4335" : "#5f6368"}
        />
      </View>
      <Text
        className="flex-1 text-base"
        style={{ color: isDestructive ? "#ea4335" : "#3c4043" }}
      >
        {label}
      </Text>
      {value ? (
        <Text className="text-sm text-gray-400 mr-2">{value}</Text>
      ) : null}
      {!isDestructive && (
        <Ionicons name="chevron-forward" size={16} color="#dadce0" />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());
  const isConnected = healthCheck?.data === "OK";

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <ScrollView
      className="flex-1 bg-[#f8f9fa]"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 20 }}
    >
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-800">プロフィール</Text>
      </View>

      {/* User Card */}
      <View className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <View className="p-5 flex-row items-center">
          {/* Avatar */}
          <View className="w-16 h-16 rounded-full bg-[#1a73e8] items-center justify-center mr-4 shadow-md">
            <Text className="text-2xl font-bold text-white">{userInitials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">
              {session?.user?.name ?? "ゲスト"}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {session?.user?.email ?? "ログインしてください"}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="border-t border-gray-100 flex-row">
          {[
            { label: "投稿", value: "0" },
            { label: "解決", value: "0" },
            { label: "評価", value: "—" },
          ].map((stat, i) => (
            <View
              key={stat.label}
              className="flex-1 py-4 items-center"
              style={{
                borderRightWidth: i < 2 ? 1 : 0,
                borderRightColor: "#f3f4f6",
              }}
            >
              <Text className="text-xl font-bold text-gray-800">{stat.value}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Connection status */}
      <View className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm">
        <View className="flex-row items-center px-5 py-3">
          <View
            className="w-2 h-2 rounded-full mr-3"
            style={{ backgroundColor: isConnected ? "#34a853" : "#ea4335" }}
          />
          <Text className="text-sm text-gray-500">
            {isConnected ? "サーバー接続中" : "オフライン"}
          </Text>
        </View>
      </View>

      {/* Settings Section */}
      <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden shadow-sm">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 pt-4 pb-2">
          設定
        </Text>
        <MenuItem icon="notifications-outline" label="通知設定" />
        <View className="h-px bg-gray-100 ml-16" />
        <MenuItem icon="shield-checkmark-outline" label="プライバシー" />
        <View className="h-px bg-gray-100 ml-16" />
        <MenuItem icon="location-outline" label="位置情報" value="ON" />
        <View className="h-px bg-gray-100 ml-16" />
        <MenuItem icon="language-outline" label="言語" value="日本語" />
      </View>

      {/* Help Section */}
      <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden shadow-sm">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 pt-4 pb-2">
          サポート
        </Text>
        <MenuItem icon="help-circle-outline" label="ヘルプ" />
        <View className="h-px bg-gray-100 ml-16" />
        <MenuItem icon="document-text-outline" label="利用規約" />
        <View className="h-px bg-gray-100 ml-16" />
        <MenuItem icon="information-circle-outline" label="バージョン" value="1.0.0" />
      </View>

      {/* Sign out */}
      {session?.user ? (
        <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden shadow-sm">
          <MenuItem
            icon="log-out-outline"
            label="サインアウト"
            isDestructive
            onPress={() => {
              authClient.signOut();
              queryClient.invalidateQueries();
            }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
