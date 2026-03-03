import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LocationData = {
  latitude: number;
  longitude: number;
};

const TOKYO_COORDINATES: LocationData = {
  latitude: 35.6762,
  longitude: 139.6503,
};

const CATEGORIES = [
  { id: "crime", label: "不審者", icon: "warning" as const },
  { id: "disaster", label: "災害", icon: "thunderstorm" as const },
  { id: "traffic", label: "交通", icon: "directions-car" as const },
  { id: "facility", label: "施設", icon: "business" as const },
];

// Mock incident pins for map visualization
const MOCK_INCIDENTS = [
  { id: "1", x: 0.42, y: 0.35, category: "crime", count: 3 },
  { id: "2", x: 0.6, y: 0.52, category: "traffic", count: 1 },
  { id: "3", x: 0.28, y: 0.6, category: "disaster", count: 2 },
  { id: "4", x: 0.7, y: 0.3, category: "crime", count: 1 },
  { id: "5", x: 0.5, y: 0.7, category: "facility", count: 1 },
];

const CATEGORY_COLORS: Record<string, string> = {
  crime: "#ea4335",
  disaster: "#ff6d00",
  traffic: "#1a73e8",
  facility: "#34a853",
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
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
      } catch {
        setLocation(TOKYO_COORDINATES);
      } finally {
        setIsLoading(false);
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

  const filteredIncidents = activeCategory
    ? MOCK_INCIDENTS.filter((i) => i.category === activeCategory)
    : MOCK_INCIDENTS;

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Map Background */}
      <View
        className="absolute inset-0"
        onLayout={(e) =>
          setMapSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        {/* Simulated map tiles */}
        <View className="flex-1 bg-[#e8eaed]">
          {/* Road grid */}
          <View className="absolute inset-0 overflow-hidden">
            {/* Horizontal roads */}
            {[15, 28, 42, 55, 68, 80].map((pct) => (
              <View
                key={`h-${pct}`}
                style={{
                  position: "absolute",
                  top: `${pct}%`,
                  left: 0,
                  right: 0,
                  height: pct % 28 === 0 ? 4 : 2,
                  backgroundColor: pct % 28 === 0 ? "#ffffff" : "#f0f0f0",
                }}
              />
            ))}
            {/* Vertical roads */}
            {[12, 25, 38, 52, 65, 78, 90].map((pct) => (
              <View
                key={`v-${pct}`}
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  top: 0,
                  bottom: 0,
                  width: pct % 25 === 0 ? 5 : 2,
                  backgroundColor: pct % 25 === 0 ? "#ffffff" : "#f0f0f0",
                }}
              />
            ))}
            {/* Park/green areas */}
            <View
              className="absolute bg-[#c8e6c9] rounded-lg opacity-70"
              style={{ top: "35%", left: "55%", width: 80, height: 60 }}
            />
            <View
              className="absolute bg-[#c8e6c9] rounded-full opacity-70"
              style={{ top: "60%", left: "15%", width: 60, height: 50 }}
            />
            {/* Building blocks */}
            {[
              { t: "18%", l: "10%", w: 40, h: 30 },
              { t: "22%", l: "60%", w: 50, h: 35 },
              { t: "45%", l: "70%", w: 35, h: 40 },
              { t: "72%", l: "40%", w: 45, h: 28 },
            ].map((b, i) => (
              <View
                key={i}
                className="absolute bg-[#dadce0] rounded-sm"
                style={{
                  top: b.t,
                  left: b.l,
                  width: b.w,
                  height: b.h,
                  opacity: 0.8,
                }}
              />
            ))}
          </View>

          {/* Incident pins */}
          {mapSize.width > 0 &&
            filteredIncidents.map((incident) => (
              <Pressable
                key={incident.id}
                className="absolute items-center"
                style={{
                  left: incident.x * mapSize.width - 16,
                  top: incident.y * mapSize.height - 36,
                }}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center shadow-lg"
                  style={{ backgroundColor: CATEGORY_COLORS[incident.category] }}
                >
                  <Ionicons name="warning" size={14} color="#fff" />
                </View>
                {incident.count > 1 && (
                  <View
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white items-center justify-center border border-gray-200"
                  >
                    <Text className="text-[9px] font-bold text-gray-700">
                      {incident.count}
                    </Text>
                  </View>
                )}
                {/* Pin tail */}
                <View
                  className="w-0 h-0"
                  style={{
                    borderLeftWidth: 4,
                    borderRightWidth: 4,
                    borderTopWidth: 6,
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderTopColor: CATEGORY_COLORS[incident.category],
                    marginTop: -1,
                  }}
                />
              </Pressable>
            ))}

          {/* Current location dot */}
          <View
            className="absolute items-center justify-center"
            style={{
              left: mapSize.width * 0.5 - 12,
              top: mapSize.height * 0.48 - 12,
            }}
          >
            <View className="w-6 h-6 rounded-full bg-white items-center justify-center shadow-md">
              <View className="w-4 h-4 rounded-full bg-[#1a73e8]" />
            </View>
            {/* Accuracy ring */}
            <View
              className="absolute rounded-full border-2 border-[#1a73e8] opacity-20"
              style={{ width: 56, height: 56 }}
            />
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="absolute left-0 right-0 px-4"
      >
        <View className="flex-row items-center bg-white rounded-2xl shadow-lg px-4 h-14">
          <Ionicons name="search" size={20} color="#9aa0a6" />
          <TextInput
            placeholder="エリアを検索"
            placeholderTextColor="#9aa0a6"
            className="flex-1 ml-3 text-base text-gray-800"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <Pressable className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
            <Ionicons name="mic-outline" size={18} color="#5f6368" />
          </Pressable>
          <Pressable className="w-9 h-9 rounded-full overflow-hidden ml-2 items-center justify-center bg-[#1a73e8]">
            <Text className="text-white text-xs font-bold">あ</Text>
          </Pressable>
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() =>
                  setActiveCategory(isActive ? null : cat.id)
                }
                className="flex-row items-center rounded-full px-4 h-9"
                style={{
                  backgroundColor: isActive ? "#e8f0fe" : "#ffffff",
                  borderWidth: isActive ? 0 : 1,
                  borderColor: "#e5e7eb",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isActive ? 0 : 0.1,
                  shadowRadius: 2,
                  elevation: isActive ? 0 : 2,
                }}
              >
                <MaterialIcons
                  name={cat.icon}
                  size={15}
                  color={isActive ? "#1a73e8" : "#5f6368"}
                />
                <Text
                  className="ml-1 text-sm font-medium"
                  style={{ color: isActive ? "#1a73e8" : "#3c4043" }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Right side controls */}
      <View
        className="absolute right-4"
        style={{ bottom: 160 }}
      >
        {/* Layer toggle */}
        <Pressable className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center mb-3">
          <MaterialIcons name="layers" size={22} color="#5f6368" />
        </Pressable>

        {/* Current location */}
        <Pressable className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center">
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
      <View
        className="absolute left-0 right-0 px-4"
        style={{ bottom: 76 }}
      >
        <View className="bg-white rounded-2xl shadow-lg px-5 py-3 flex-row items-center">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-0.5">現在地周辺</Text>
            <Text className="text-sm font-semibold text-gray-800">
              {filteredIncidents.length} 件のインシデント
            </Text>
          </View>
          <View className="flex-row gap-2">
            {Object.entries(
              filteredIncidents.reduce<Record<string, number>>((acc, i) => {
                acc[i.category] = (acc[i.category] ?? 0) + 1;
                return acc;
              }, {})
            )
              .slice(0, 3)
              .map(([cat, count]) => (
                <View
                  key={cat}
                  className="flex-row items-center rounded-full px-2 py-1"
                  style={{ backgroundColor: `${CATEGORY_COLORS[cat]}20` }}
                >
                  <View
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  />
                  <Text
                    className="text-xs font-medium"
                    style={{ color: CATEGORY_COLORS[cat] }}
                  >
                    {count}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      </View>
    </View>
  );
}
