import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView, Text, View } from "react-native";

import { orpc } from "@/utils/orpc";

const PERIOD_OPTIONS = [
  { label: "24時間", value: Date.now() - 24 * 60 * 60 * 1000 },
  { label: "7日間", value: Date.now() - 7 * 24 * 60 * 60 * 1000 },
  { label: "30日間", value: Date.now() - 30 * 24 * 60 * 60 * 1000 },
] as const;

type PeriodValue = (typeof PERIOD_OPTIONS)[number]["value"];

type MapFiltersProps = {
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  selectedSince: number | undefined;
  onSinceChange: (since: number | undefined) => void;
};

export function MapFilters({
  selectedCategoryId,
  onCategoryChange,
  selectedSince,
  onSinceChange,
}: MapFiltersProps) {
  const { data: categories } = useQuery(orpc.incident.listCategories.queryOptions());

  const handlePeriodPress = (value: PeriodValue) => {
    // 同じ期間を再度タップしたらリセット
    const approximatelySame =
      selectedSince !== undefined && Math.abs(selectedSince - value) < 60_000;
    onSinceChange(approximatelySame ? undefined : value);
  };

  return (
    <View className="gap-2">
      {/* カテゴリフィルタ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}
      >
        <Pressable
          onPress={() => onCategoryChange(null)}
          className="rounded-full px-4 h-9 items-center justify-center"
          style={{
            backgroundColor: selectedCategoryId === null ? "#e8f0fe" : "#ffffff",
            borderWidth: selectedCategoryId === null ? 0 : 1,
            borderColor: "#e5e7eb",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: selectedCategoryId === null ? 0 : 0.1,
            shadowRadius: 2,
            elevation: selectedCategoryId === null ? 0 : 2,
          }}
        >
          <Text
            className="text-sm font-medium"
            style={{ color: selectedCategoryId === null ? "#1a73e8" : "#3c4043" }}
          >
            すべて
          </Text>
        </Pressable>

        {categories?.map((cat) => {
          const isActive = selectedCategoryId === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onCategoryChange(isActive ? null : cat.id)}
              className="rounded-full px-4 h-9 items-center justify-center"
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
              <Text
                className="text-sm font-medium"
                style={{ color: isActive ? "#1a73e8" : "#3c4043" }}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 期間フィルタ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}
      >
        {PERIOD_OPTIONS.map((opt) => {
          const isActive =
            selectedSince !== undefined && Math.abs(selectedSince - opt.value) < 60_000;
          return (
            <Pressable
              key={opt.label}
              onPress={() => handlePeriodPress(opt.value)}
              className="rounded-full px-4 h-9 items-center justify-center"
              style={{
                backgroundColor: isActive ? "#fce8e6" : "#ffffff",
                borderWidth: isActive ? 0 : 1,
                borderColor: "#e5e7eb",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isActive ? 0 : 0.1,
                shadowRadius: 2,
                elevation: isActive ? 0 : 2,
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: isActive ? "#d93025" : "#3c4043" }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
