import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";

import { Container } from "@/components/container";
import { useThemeColor } from "heroui-native";

const TOKYO_COORDINATES = {
  latitude: 35.6762,
  longitude: 139.6503,
};

const DEFAULT_DELTA = 0.1;

type LocationData = {
  latitude: number;
  longitude: number;
};

export default function MapScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backgroundColor = useThemeColor("background");
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("位置情報の権限が必要です");
          setLocation(TOKYO_COORDINATES);
          setIsLoading(false);
          return;
        }

        const userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
      } catch (err) {
        console.error("Failed to get location:", err);
        setError("位置情報の取得に失敗しました");
        setLocation(TOKYO_COORDINATES);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <Container className="items-center justify-center">
        <ActivityIndicator size="large" color={foregroundColor} />
        <Text className="mt-4 text-foreground text-base">読み込み中...</Text>
      </Container>
    );
  }

  return (
    <Container isScrollable={false}>
      <View className="flex-1 items-center justify-center bg-background">
        <View className="w-full h-full items-center justify-center bg-muted/10">
          {/* Placeholder until react-native-maps is integrated */}
          <View className="items-center gap-4 px-6">
            <Ionicons name="map" size={64} color={mutedColor} />
            <Text className="text-xl font-semibold text-foreground text-center">
              インシデントマップ
            </Text>
            <Text className="text-sm text-muted text-center">
              現在地: {location?.latitude.toFixed(4)},{" "}
              {location?.longitude.toFixed(4)}
            </Text>
            {error && (
              <Text className="text-xs text-danger text-center">{error}</Text>
            )}
            <Text className="text-xs text-muted text-center mt-4">
              マップは近日公開予定です
            </Text>
          </View>
        </View>
      </View>
    </Container>
  );
}
