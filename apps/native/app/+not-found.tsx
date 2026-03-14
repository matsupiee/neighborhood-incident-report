import { Link, Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🤔</Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Page Not Found
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#6b7280",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          The page you're looking for doesn't exist.
        </Text>
        <Link href="/(tabs)/map" asChild>
          <Pressable
            style={{
              paddingHorizontal: 24,
              paddingVertical: 10,
              backgroundColor: "#1a73e8",
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Go Home</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
