import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { orpc } from "@/utils/orpc";

export const PERIOD_OPTIONS = [
  { label: "すべて", value: undefined as number | undefined },
  { label: "24時間", value: 24 * 60 * 60 * 1000 },
  { label: "7日間", value: 7 * 24 * 60 * 60 * 1000 },
  { label: "30日間", value: 30 * 24 * 60 * 60 * 1000 },
] as const;

export type FilterState = {
  categoryId: string | null;
  periodMs: number | undefined;
};

export const DEFAULT_FILTERS: FilterState = {
  categoryId: null,
  periodMs: 7 * 24 * 60 * 60 * 1000, // 7日間をデフォルト
};

type MapFilterSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
};

type Category = { id: string; name: string };

export function MapFilterSheet({ isOpen, onClose, filters, onApply }: MapFilterSheetProps) {
  const { data: categories } = useQuery(orpc.incident.listCategories.queryOptions());
  const sheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: Parameters<typeof BottomSheetBackdrop>[0]) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#d1d5db", width: 36 }}
      backgroundStyle={{ backgroundColor: "#fff", borderRadius: 20 }}
    >
      <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        {isOpen && (
          <FilterSheetContent
            categories={categories ?? []}
            initialFilters={filters}
            onApply={(next) => {
              onApply(next);
              onClose();
            }}
            onReset={() => {
              onApply(DEFAULT_FILTERS);
              onClose();
            }}
          />
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

function FilterSheetContent({
  categories,
  initialFilters,
  onApply,
  onReset,
}: {
  categories: Category[];
  initialFilters: FilterState;
  onApply: (f: FilterState) => void;
  onReset: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(initialFilters.categoryId);
  const [periodMs, setPeriodMs] = useState<number | undefined>(initialFilters.periodMs);

  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "600",
          color: "#111827",
          marginBottom: 12,
        }}
      >
        フィルター
      </Text>

      {/* カテゴリ */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: "#6b7280",
          marginBottom: 8,
        }}
      >
        カテゴリ
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        style={{ marginBottom: 16, flexGrow: 0 }}
      >
        <FilterChip
          label="すべて"
          isActive={categoryId === null}
          color="blue"
          onPress={() => setCategoryId(null)}
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat.id}
            label={cat.name}
            isActive={categoryId === cat.id}
            color="blue"
            onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
          />
        ))}
      </ScrollView>

      {/* 期間 */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: "#6b7280",
          marginBottom: 8,
        }}
      >
        期間
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {PERIOD_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.label}
            label={opt.label}
            isActive={periodMs === opt.value}
            color="red"
            onPress={() => setPeriodMs(opt.value)}
          />
        ))}
      </View>

      {/* ボタン */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          onPress={onReset}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "500", color: "#6b7280" }}>リセット</Text>
        </Pressable>
        <Pressable
          onPress={() => onApply({ categoryId, periodMs })}
          style={{
            flex: 2,
            height: 44,
            borderRadius: 12,
            backgroundColor: "#1a73e8",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>適用する</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FilterChip({
  label,
  isActive,
  color,
  onPress,
}: {
  label: string;
  isActive: boolean;
  color: "blue" | "red";
  onPress: () => void;
}) {
  const activeColors = {
    blue: { bg: "#e8f0fe", text: "#1a73e8" },
    red: { bg: "#fce8e6", text: "#d93025" },
  };
  const active = activeColors[color];

  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isActive ? active.bg : "#f3f4f6",
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "500",
          color: isActive ? active.text : "#374151",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
