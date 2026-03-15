import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { reportingStore } from "@/utils/reporting-store";

// biome-ignore lint: React Navigation types are complex; using any for tabBar render prop
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTabBar({
  state,
  navigation,
}: {
  state: any;
  descriptors: any;
  navigation: any;
  [key: string]: any;
}) {
  const insets = useSafeAreaInsets();
  const tabHeight = Platform.OS === "ios" ? 64 : 56;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#ffffff",
        borderTopColor: "#e5e7eb",
        borderTopWidth: 1,
        paddingBottom: insets.bottom,
        height: tabHeight + insets.bottom,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === "map") {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "flex-end",
                paddingBottom: 10,
                gap: 3,
              }}
            >
              <Ionicons
                name={isFocused ? "map" : "map-outline"}
                size={24}
                color={isFocused ? "#1a73e8" : "#9aa0a6"}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: isFocused ? "#1a73e8" : "#9aa0a6",
                }}
              >
                マップ
              </Text>
            </Pressable>
          );
        }

        if (route.name === "profile") {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "flex-end",
                paddingBottom: 10,
                gap: 3,
              }}
            >
              <Ionicons
                name={isFocused ? "person-circle" : "person-circle-outline"}
                size={24}
                color={isFocused ? "#1a73e8" : "#9aa0a6"}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: isFocused ? "#1a73e8" : "#9aa0a6",
                }}
              >
                プロフィール
              </Text>
            </Pressable>
          );
        }

        return null;
      })}

      {/* Center "+" button — positioned absolutely in the center */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: insets.bottom,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={() => reportingStore.trigger()}
          style={({ pressed }) => ({
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: "#1a73e8",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
            shadowColor: "#1a73e8",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: pressed ? 0.2 : 0.4,
            shadowRadius: 10,
            elevation: 10,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Ionicons name="add" size={30} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="map" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
