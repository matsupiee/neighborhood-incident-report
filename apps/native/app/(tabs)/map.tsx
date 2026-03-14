import { meshCodeToCenter } from "@neighborhood-incident-report/api/lib/mesh/convert";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Circle, PROVIDER_DEFAULT, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DEFAULT_FILTERS,
  FilterState,
  MapFilterSheet,
  PERIOD_OPTIONS,
} from "@/components/map-filters";
import { ReportSheet } from "@/components/report-sheet";
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

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const searchRef = useRef<TextInput>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const fabScale = useRef(new Animated.Value(1)).current;

  // Reporting mode
  const [isReporting, setIsReporting] = useState(false);
  const [isPinConfirmed, setIsPinConfirmed] = useState(false);
  const [reportingCoords, setReportingCoords] = useState(TOKYO_COORDINATES);
  const [isPanning, setIsPanning] = useState(false);

  // Pin animation (only used in reporting mode)
  const pinY = useRef(new Animated.Value(0)).current;
  const pinScale = useRef(new Animated.Value(1)).current;
  const shadowOpacity = useRef(new Animated.Value(0.25)).current;

  // sinceをfilters.periodMsから計算（リクエスト時に現在時刻基準で計算）
  const since = filters.periodMs !== undefined ? Date.now() - filters.periodMs : undefined;

  const { data: heatmapData } = useQuery({
    ...orpc.incident.getHeatmap.queryOptions({
      input: {
        categoryId: filters.categoryId ?? undefined,
        since,
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
        const coords = {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        };
        setLocation(coords);
        setReportingCoords(coords);
      } catch {
        setLocation(TOKYO_COORDINATES);
      } finally {
        setIsLocationLoading(false);
      }
    })();
  }, []);

  const handleMapReady = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        600,
      );
    }
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
        400,
      );
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    Keyboard.dismiss();
    setIsSearching(true);
    setSearchError(null);

    try {
      const gsiUrl = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(
        query,
      )}`;
      const res = await fetch(gsiUrl);
      const gsiResults = res.ok ? await res.json() : [];
      if (!gsiResults.length) {
        setSearchError("場所が見つかりませんでした");
        return;
      }
      const [longitude, latitude] = gsiResults[0].geometry.coordinates;
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500,
      );
    } catch {
      setSearchError("検索中にエラーが発生しました");
    } finally {
      setIsSearching(false);
    }
  };

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
      setIsReporting(true);
    });
  };

  const handleReportSuccess = () => {
    setIsReporting(false);
    setIsPinConfirmed(false);
  };

  const handleReportCancel = () => {
    setIsReporting(false);
    setIsPinConfirmed(false);
  };

  const handlePinConfirm = () => {
    setIsPinConfirmed(true);
  };

  const handlePinCancel = () => {
    setIsReporting(false);
    setIsPinConfirmed(false);
  };

  const animatePinUp = () => {
    Animated.parallel([
      Animated.spring(pinY, {
        toValue: -12,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(pinScale, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0.1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animatePinDown = () => {
    Animated.parallel([
      Animated.spring(pinY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 400,
        friction: 12,
      }),
      Animated.spring(pinScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400,
        friction: 12,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0.25,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRegionChange = () => {
    if (!isReporting) return;
    if (!isPanning) {
      setIsPanning(true);
      animatePinUp();
    }
  };

  const handleRegionChangeComplete = (region: Region) => {
    if (!isReporting) return;
    setReportingCoords({
      latitude: region.latitude,
      longitude: region.longitude,
    });
    setIsPanning(false);
    animatePinDown();
  };

  const removeFilter = (key: keyof FilterState) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === "categoryId" ? null : DEFAULT_FILTERS.periodMs,
    }));
  };

  if (isLocationLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  const center = location ?? TOKYO_COORDINATES;
  const maxCount = heatmapData?.reduce((max, cell) => Math.max(max, cell.count), 1) ?? 1;

  // アクティブなフィルターラベルを生成
  const activePeriodLabel = PERIOD_OPTIONS.find((o) => o.value === filters.periodMs)?.label;
  const hasNonDefaultFilters =
    filters.categoryId !== null || filters.periodMs !== DEFAULT_FILTERS.periodMs;

  return (
    <View className="flex-1">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

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
        onMapReady={handleMapReady}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
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

      {/* Reporting mode: center pin overlay */}
      {isReporting && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Animated.View
            style={{
              alignItems: "center",
              transform: [{ translateY: pinY }, { scale: pinScale }],
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#1a73e8",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowRadius: 6,
                shadowOpacity: 0.3,
                elevation: 8,
              }}
            >
              <Ionicons name="warning" size={20} color="#ffffff" />
            </View>
            {/* Pin stem */}
            <View
              style={{
                width: 2,
                height: 10,
                backgroundColor: "#1a73e8",
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
              }}
            />
            {/* Shadow dot */}
            <Animated.View
              style={{
                width: 10,
                height: 5,
                borderRadius: 5,
                backgroundColor: "#000",
                opacity: shadowOpacity,
              }}
            />
          </Animated.View>
        </View>
      )}

      {/* Search bar + filter chips — hidden in reporting mode */}
      {!isReporting && (
        <View style={{ paddingTop: insets.top + 8 }} className="absolute left-0 right-0 px-4">
          {/* 検索バー（フィルターボタン統合） */}
          <View className="flex-row items-center bg-white rounded-2xl shadow-lg px-4 h-14 mb-2">
            <Ionicons name="search" size={20} color="#9aa0a6" />
            <TextInput
              ref={searchRef}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setSearchError(null);
              }}
              onSubmitEditing={handleSearch}
              placeholder="エリアを検索"
              placeholderTextColor="#9aa0a6"
              returnKeyType="search"
              className="flex-1 ml-3 text-base text-gray-800"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color="#1a73e8" />
            ) : searchQuery.length > 0 ? (
              <Pressable
                onPress={handleSearch}
                className="w-9 h-9 rounded-full bg-[#1a73e8] items-center justify-center ml-2"
              >
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </Pressable>
            ) : null}

            {/* 区切り線 */}
            <View
              style={{
                width: 1,
                height: 20,
                backgroundColor: "#e5e7eb",
                marginHorizontal: 10,
              }}
            />

            {/* フィルターボタン */}
            <Pressable
              onPress={() => setIsFilterOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingVertical: 6,
                paddingHorizontal: 2,
              }}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={hasNonDefaultFilters ? "#1a73e8" : "#9aa0a6"}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: hasNonDefaultFilters ? "#1a73e8" : "#9aa0a6",
                }}
              >
                フィルター
              </Text>
              {hasNonDefaultFilters && (
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: "#1a73e8",
                    position: "absolute",
                    top: 2,
                    right: -4,
                  }}
                />
              )}
            </Pressable>
          </View>

          {/* 検索エラー */}
          {searchError ? (
            <View className="bg-white rounded-xl shadow-md px-4 py-2 mb-2">
              <Text className="text-sm text-red-500">{searchError}</Text>
            </View>
          ) : null}

          {/* アクティブフィルターチップ（デフォルト以外のフィルターのみ表示） */}
          {hasNonDefaultFilters && (
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {filters.categoryId !== null && (
                <ActiveFilterChip
                  label="カテゴリ絞り込み中"
                  onRemove={() => removeFilter("categoryId")}
                />
              )}
              {filters.periodMs !== DEFAULT_FILTERS.periodMs && activePeriodLabel && (
                <ActiveFilterChip
                  label={activePeriodLabel}
                  onRemove={() => removeFilter("periodMs")}
                />
              )}
            </View>
          )}
        </View>
      )}

      {/* Reporting mode: location hint */}
      {isReporting && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 16,
            left: 16,
            right: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(255,255,255,0.95)",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Ionicons name="location" size={16} color={isPanning ? "#9aa0a6" : "#1a73e8"} />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              color: isPanning ? "#9aa0a6" : "#374151",
            }}
          >
            {isPanning ? "移動中..." : "地図を動かして場所を調整"}
          </Text>
        </View>
      )}

      {/* 現在地ボタン */}
      {!isReporting && (
        <View className="absolute right-4" style={{ bottom: 100 }}>
          <Pressable
            onPress={handleMyLocation}
            className="w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center"
          >
            <MaterialIcons name="my-location" size={22} color="#1a73e8" />
          </Pressable>
        </View>
      )}

      {/* FAB - 報告する (hidden while reporting) */}
      {!isReporting && (
        <Animated.View
          style={{
            position: "absolute",
            right: 16,
            bottom: 24,
            transform: [{ scale: fabScale }],
          }}
        >
          <Pressable
            onPress={handleFabPress}
            className="h-14 rounded-2xl items-center justify-center shadow-xl flex-row px-5"
            style={{ backgroundColor: "#1a73e8", gap: 6 }}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
            <Text className="text-white font-semibold text-sm">報告する</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* フィルターボトムシート */}
      <MapFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
      />

      {/* Reporting mode: pin confirm bottom bar */}
      {isReporting && !isPinConfirmed && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#ffffff",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 16,
            gap: 10,
          }}
        >
          <Pressable
            onPress={handlePinConfirm}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#1a73e8",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}>
              この場所で報告する
            </Text>
          </Pressable>
          <Pressable
            onPress={handlePinCancel}
            style={{
              height: 44,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f3f4f6",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "500", color: "#6b7280" }}>キャンセル</Text>
          </Pressable>
        </View>
      )}

      {/* Report sheet */}
      <ReportSheet
        isVisible={isReporting && isPinConfirmed}
        coords={reportingCoords}
        onSuccess={handleReportSuccess}
        onCancel={handleReportCancel}
      />
    </View>
  );
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Pressable
      onPress={onRemove}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        height: 28,
        paddingHorizontal: 10,
        borderRadius: 14,
        backgroundColor: "#e8f0fe",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "500", color: "#1a73e8" }}>{label}</Text>
      <Ionicons name="close" size={12} color="#1a73e8" />
    </Pressable>
  );
}
