import { meshCodeToCenter } from "@neighborhood-incident-report/api/lib/mesh/convert";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import MapView, { Circle, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MapFilters } from "@/components/map-filters";
import { orpc } from "@/utils/orpc";

type LocationData = {
  latitude: number;
  longitude: number;
};

const TOKYO_COORDINATES: LocationData = {
  latitude: 35.6762,
  longitude: 139.6503,
};

// 3次メッシュ（約1km×1km）の半径（メートル）
const MESH_RADIUS_METERS = 600;

// ヒートマップの色（件数が増えるほど不透明になる）
const HEATMAP_COLOR = "#ea4335";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedSince, setSelectedSince] = useState<number | undefined>(
    undefined
  );
  const fabScale = useRef(new Animated.Value(1)).current;

  // ヒートマップデータ取得（6時間キャッシュ）
  const { data: heatmapData, isLoading: isHeatmapLoading } = useQuery({
    ...orpc.incident.getHeatmap.queryOptions({
      input: {
        categoryId: selectedCategoryId ?? undefined,
        since: selectedSince,
      },
    }),
    staleTime: 6 * 60 * 60 * 1000,
  });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocation(TOKYO_COORDINATES);
          setIsLocationLoading(false);
          return;
        }
        const userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
      } catch {
        setLocation(TOKYO_COORDINATES);
      } finally {
        setIsLocationLoading(false);
      }
    })();
  }, []);

  const handleFabPress = () => {
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push("/screens/post-incident");
    });
  };

  const handleMyLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        400
      );
    }
  };

  if (isLocationLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  const center = location ?? TOKYO_COORDINATES;
  const totalCount =
    heatmapData?.reduce((sum, cell) => sum + cell.count, 0) ?? 0;
  const maxCount =
    heatmapData?.reduce((max, cell) => Math.max(max, cell.count), 1) ?? 1;

  return (
    <View className="flex-1">
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Real Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {heatmapData?.map((cell) => {
          const { lat, lng } = meshCodeToCenter(cell.meshCode);
          const opacity = 0.15 + (cell.count / maxCount) * 0.55;
          return (
            <Circle
              key={cell.meshCode}
              center={{ latitude: lat, longitude: lng }}
              radius={MESH_RADIUS_METERS}
              fillColor={`rgba(234, 67, 53, ${opacity})`}
              strokeColor="rgba(234, 67, 53, 0.3)"
              strokeWidth={1}
            />
          );
        })}
      </MapView>

      {/* Filters overlay */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="absolute left-0 right-0 px-4"
      >
        <MapFilters
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
          selectedSince={selectedSince}
          onSinceChange={setSelectedSince}
        />
      </View>

      {/* My location button */}
      <View className="absolute right-4" style={{ bottom: 160 }}>
        <Pressable
          onPress={handleMyLocation}
          className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center"
        >
          <MaterialIcons name="my-location" size={22} color="#1a73e8" />
        </Pressable>
      </View>

      {/* FAB - Post Incident */}
      <Animated.View
        style={{
          position: "absolute",
          right: 16,
          bottom: 100,
          transform: [{ scale: fabScale }],
        }}
      >
        <Pressable
          onPress={handleFabPress}
          className="w-14 h-14 rounded-2xl items-center justify-center shadow-xl"
          style={{ backgroundColor: "#1a73e8" }}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </Pressable>
      </Animated.View>

      {/* Bottom Info Strip */}
      <View className="absolute left-0 right-0 px-4" style={{ bottom: 76 }}>
        <View className="bg-white rounded-2xl shadow-lg px-5 py-3 flex-row items-center">
          {isHeatmapLoading ? (
            <ActivityIndicator size="small" color="#1a73e8" />
          ) : (
            <>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-0.5">現在地周辺</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {totalCount} 件のインシデント
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: HEATMAP_COLOR }}
                />
                <Text className="text-xs text-gray-500">
                  ヒートマップ表示中
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
