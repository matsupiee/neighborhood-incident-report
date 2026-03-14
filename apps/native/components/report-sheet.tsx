import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import z from "zod";

import { orpc, queryClient } from "@/utils/orpc";

type TimeRange = "MIDNIGHT" | "MORNING" | "DAYTIME" | "EVENING" | "NIGHT_EARLY" | "NIGHT_LATE";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string; icon: string }[] = [
  { value: "MIDNIGHT", label: "深夜\n0〜6時", icon: "🌙" },
  { value: "MORNING", label: "朝\n6〜10時", icon: "🌅" },
  { value: "DAYTIME", label: "昼\n10〜16時", icon: "☀️" },
  { value: "EVENING", label: "夕方\n16〜20時", icon: "🌆" },
  { value: "NIGHT_EARLY", label: "夜\n20〜22時", icon: "🌃" },
  { value: "NIGHT_LATE", label: "深夜前\n22〜24時", icon: "🌉" },
];

const postFormSchema = z.object({
  timeRange: z.enum(["MIDNIGHT", "MORNING", "DAYTIME", "EVENING", "NIGHT_EARLY", "NIGHT_LATE"]),
  categoryIds: z.array(z.string()).min(1, "最低1つのカテゴリを選択してください").max(5),
  description: z.string().min(1, "説明は必須です").max(200, "説明は200文字以内です"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

interface ReportSheetProps {
  isVisible: boolean;
  coords: { latitude: number; longitude: number };
  onSuccess: () => void;
  onCancel: () => void;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.55;
// 閉じる時は bottom safe area も含めた高さ分だけ押し出す
const SHEET_TRANSLATE_CLOSED = SCREEN_HEIGHT;

export function ReportSheet({ isVisible, coords, onSuccess, onCancel }: ReportSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SHEET_TRANSLATE_CLOSED)).current;

  const [timeRange, setTimeRange] = useState<TimeRange>("DAYTIME");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const categoriesQuery = useQuery(orpc.incident.listCategories.queryOptions());

  const createMutation = useMutation(
    orpc.incident.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        resetForm();
        onSuccess();
      },
      onError: (error) => {
        console.error("Failed to create incident:", error);
        Alert.alert("エラー", "投稿に失敗しました");
      },
    }),
  );

  const resetForm = () => {
    setTimeRange("DAYTIME");
    setCategoryIds([]);
    setDescription("");
  };

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isVisible ? 0 : SHEET_TRANSLATE_CLOSED,
      duration: 320,
      useNativeDriver: true,
    }).start();

    if (!isVisible) {
      resetForm();
    }
  }, [isVisible]);

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const handleSubmit = () => {
    const parsed = postFormSchema.safeParse({
      timeRange,
      categoryIds,
      description,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    if (!parsed.success) {
      Alert.alert("入力エラー", parsed.error.issues.map((e) => e.message).join("\n"));
      return;
    }
    createMutation.mutate(parsed.data);
  };

  const canSubmit = !createMutation.isPending && description.length > 0 && categoryIds.length > 0;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: SHEET_HEIGHT + insets.bottom,
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 20,
        transform: [{ translateY }],
      }}
    >
      {/* Drag handle */}
      <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#e5e7eb",
          }}
        />
      </View>

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 8,
        }}
      >
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: "#111827" }}>
          インシデントを報告
        </Text>
        <Pressable
          onPress={onCancel}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#f3f4f6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={18} color="#6b7280" />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        bottomOffset={80}
      >
        {/* Time range */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#9ca3af",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            時間帯
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {TIME_RANGE_OPTIONS.map((opt) => {
              const isActive = timeRange === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setTimeRange(opt.value)}
                  style={{
                    width: "31%",
                    borderRadius: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    alignItems: "center",
                    backgroundColor: isActive ? "#1a73e8" : "#f9fafb",
                  }}
                >
                  <Text style={{ fontSize: 18, marginBottom: 2 }}>{opt.icon}</Text>
                  <Text
                    style={{
                      fontSize: 11,
                      textAlign: "center",
                      lineHeight: 16,
                      color: isActive ? "#ffffff" : "#6b7280",
                      fontWeight: isActive ? "600" : "400",
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: "#f3f4f6",
            marginHorizontal: 20,
          }}
        />

        {/* Categories */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#9ca3af",
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              カテゴリ
            </Text>
            {categoryIds.length > 0 && (
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>{categoryIds.length}/5</Text>
            )}
          </View>
          {categoriesQuery.isLoading ? (
            <ActivityIndicator size="small" color="#1a73e8" />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(categoriesQuery.data ?? []).map((cat) => {
                const isActive = categoryIds.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isActive ? "#1a73e8" : "#f3f4f6",
                    }}
                  >
                    {isActive && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: isActive ? "#ffffff" : "#6b7280",
                      }}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: "#f3f4f6",
            marginHorizontal: 20,
          }}
        />

        {/* Description */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#9ca3af",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            詳細
          </Text>
          <View
            style={{
              borderRadius: 16,
              backgroundColor: "#f9fafb",
              padding: 14,
              borderWidth: 1,
              borderColor: "#f3f4f6",
            }}
          >
            <TextInput
              placeholder="状況を簡潔に記入してください（個人情報は含めないでください）"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={(text) => setDescription(text.slice(0, 200))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
              style={{
                fontSize: 14,
                lineHeight: 22,
                color: "#111827",
                minHeight: 96,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                color: "#9ca3af",
                textAlign: "right",
                marginTop: 6,
              }}
            >
              {description.length}/200
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Sticky submit */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#ffffff",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
        }}
      >
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={{
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            backgroundColor: canSubmit ? "#1a73e8" : "#e5e7eb",
          }}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: canSubmit ? "#ffffff" : "#9ca3af",
              }}
            >
              この場所で報告する
            </Text>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}
