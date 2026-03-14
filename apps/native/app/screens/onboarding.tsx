import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useRef, useState } from "react";
import { Animated, Dimensions, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ONBOARDING_COMPLETED_KEY = "onboardingCompleted";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Slide = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    id: "1",
    icon: "shield-checkmark",
    iconColor: "#1a73e8",
    iconBg: "#e8f0fe",
    title: "近隣の安全を\nみんなで守る",
    description: "不審者・不審物・危険な場所など、\n近隣のインシデントを匿名で報告・共有できます。",
  },
  {
    id: "2",
    icon: "map",
    iconColor: "#34a853",
    iconBg: "#e6f4ea",
    title: "マップで\n状況を把握する",
    description:
      "近隣のインシデントをヒートマップで確認。\n自分の周辺の安全状況がひと目でわかります。",
  },
  {
    id: "3",
    icon: "lock-closed",
    iconColor: "#ea4335",
    iconBg: "#fce8e6",
    title: "プライバシーを\n守って報告",
    description:
      "位置情報は自動的にエリア単位でぼかして保存。\n個人が特定される情報は一切記録されません。",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, "true");
    router.replace("/(auth)/sign-in");
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View className="flex-1 bg-white" style={{ paddingBottom: insets.bottom }}>
      {/* Skip button */}
      <View style={{ paddingTop: insets.top + 12 }} className="absolute top-0 right-0 px-4 z-10">
        <Pressable onPress={handleComplete} className="py-2 px-3">
          <Text className="text-sm text-gray-400 font-medium">スキップ</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
            <View
              className="w-28 h-28 rounded-3xl items-center justify-center mb-10"
              style={{ backgroundColor: item.iconBg }}
            >
              <Ionicons name={item.icon} size={56} color={item.iconColor} />
            </View>
            <Text className="text-3xl font-bold text-gray-900 text-center mb-4 leading-tight">
              {item.title}
            </Text>
            <Text className="text-base text-gray-500 text-center leading-relaxed">
              {item.description}
            </Text>
          </View>
        )}
      />

      {/* Dots + Button */}
      <View className="px-6 pb-6 gap-6">
        {/* Page dots */}
        <View className="flex-row justify-center gap-2">
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const width = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={i}
                style={{ width, opacity }}
                className="h-2 rounded-full bg-[#1a73e8]"
              />
            );
          })}
        </View>

        {/* Next / Start button */}
        <Pressable
          onPress={handleNext}
          className="h-14 rounded-2xl items-center justify-center flex-row"
          style={{ backgroundColor: "#1a73e8", gap: 6 }}
        >
          <Text className="text-white font-semibold text-base">{isLast ? "はじめる" : "次へ"}</Text>
          {!isLast && <Ionicons name="arrow-forward" size={18} color="#ffffff" />}
        </Pressable>
      </View>
    </View>
  );
}
