import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Checkbox,
  Chip,
  Input,
  ScrollView,
  Spinner,
  Surface,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useForm } from "@tanstack/react-form";
import { useState, useEffect } from "react";
import { Text, View, Alert, ActivityIndicator, Pressable } from "react-native";
import z from "zod";

import { Container } from "@/components/container";
import { useAuthGuard } from "@/lib/auth-guard";
import { orpc, queryClient } from "@/utils/orpc";

// TimeRange enum
const TIME_RANGE_OPTIONS = [
  { value: "MIDNIGHT", label: "深夜（0〜6時）" },
  { value: "MORNING", label: "朝（6〜10時）" },
  { value: "DAYTIME", label: "昼（10〜16時）" },
  { value: "EVENING", label: "夕方（16〜20時）" },
  { value: "NIGHT_EARLY", label: "夜（20〜22時）" },
  { value: "NIGHT_LATE", label: "深夜前（22〜24時）" },
];

// Form validation schema
const postFormSchema = z.object({
  timeRange: z.enum([
    "MIDNIGHT",
    "MORNING",
    "DAYTIME",
    "EVENING",
    "NIGHT_EARLY",
    "NIGHT_LATE",
  ]),
  categoryIds: z
    .array(z.string())
    .min(1, "最低1つのカテゴリを選択してください")
    .max(5),
  description: z
    .string()
    .min(1, "説明は必須です")
    .max(200, "説明は200文字以内です"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type PostFormData = z.infer<typeof postFormSchema>;

type Category = {
  id: string;
  name: string;
};

export default function PostIncidentScreen() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuthGuard();
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );

  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const dangerColor = useThemeColor("danger");
  const successColor = useThemeColor("success");

  // Fetch categories
  const categoriesQuery = useQuery(orpc.todo.getAll.queryOptions());

  const form = useForm<PostFormData>({
    defaultValues: {
      timeRange: "DAYTIME",
      categoryIds: [],
      description: "",
      latitude: 35.6762,
      longitude: 139.6503,
    },
    onSubmit: async ({ value }) => {
      if (!session?.user) {
        Alert.alert("エラー", "ログインが必要です");
        return;
      }

      // Validate
      const parsed = postFormSchema.safeParse(value);
      if (!parsed.success) {
        Alert.alert(
          "入力エラー",
          parsed.error.errors.map((e) => e.message).join("\n"),
        );
        return;
      }

      createMutation.mutate(value);
    },
  });

  // Create incident mutation
  const createMutation = useMutation(
    orpc.incident.create.mutationOptions({
      onSuccess: () => {
        Alert.alert("成功", "インシデントが投稿されました", [
          {
            text: "OK",
            onPress: () => {
              queryClient.invalidateQueries();
              router.push("/(drawer)");
            },
          },
        ]);
      },
      onError: (error) => {
        console.error("Failed to create incident:", error);
        Alert.alert("エラー", "投稿に失敗しました");
      },
    }),
  );

  // Request location permission on mount
  useEffect(() => {
    if (!authLoading && session?.user) {
      (async () => {
        try {
          setLocationStatus("loading");
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setLocationStatus("error");
            Alert.alert("権限が必要", "位置情報へのアクセスが拒否されました");
            return;
          }

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          await form.setFieldValue("latitude", location.coords.latitude);
          await form.setFieldValue("longitude", location.coords.longitude);
          setLocationStatus("success");
        } catch (err) {
          console.error("Failed to get location:", err);
          setLocationStatus("error");
          Alert.alert("エラー", "位置情報の取得に失敗しました");
        }
      })();
    }
  }, [authLoading, session?.user]);

  if (authLoading) {
    return (
      <Container className="items-center justify-center">
        <Spinner size="lg" />
      </Container>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <Container>
      <ScrollView contentContainerClassName="p-4">
        <Text className="text-2xl font-semibold text-foreground mb-6">
          インシデント投稿
        </Text>

        {/* Location status */}
        <Surface
          variant="secondary"
          className="mb-4 p-3 rounded-lg flex-row items-center gap-3"
        >
          {locationStatus === "loading" && <ActivityIndicator size="small" />}
          {locationStatus === "success" && (
            <Ionicons name="checkmark-circle" size={20} color={successColor} />
          )}
          {locationStatus === "error" && (
            <Ionicons name="close-circle" size={20} color={dangerColor} />
          )}
          <Text
            className={`flex-1 text-sm ${locationStatus === "success" ? "text-success" : "text-muted"}`}
          >
            {locationStatus === "loading"
              ? "位置情報取得中..."
              : locationStatus === "success"
                ? "現在地を取得済み"
                : "位置情報の取得に失敗"}
          </Text>
        </Surface>

        {/* Time range field */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-3">
            時間帯を選択
          </Text>
          <form.Field
            name="timeRange"
            children={(field) => (
              <View className="gap-2">
                {TIME_RANGE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => field.setValue(option.value as any)}
                    className={`p-3 rounded-lg border ${
                      field.state.value === option.value
                        ? "border-primary bg-primary/10"
                        : "border-muted bg-muted/5"
                    }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`w-4 h-4 rounded-full border-2 ${
                          field.state.value === option.value
                            ? "border-primary bg-primary"
                            : "border-muted"
                        }`}
                      />
                      <Text
                        className={`text-sm ${field.state.value === option.value ? "text-foreground font-semibold" : "text-muted"}`}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </View>

        {/* Categories field */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-3">
            カテゴリを選択（複数可）
          </Text>
          <form.Field
            name="categoryIds"
            children={(field) => (
              <View className="gap-2">
                {[
                  { id: "1", name: "カテゴリ1" },
                  { id: "2", name: "カテゴリ2" },
                  { id: "3", name: "カテゴリ3" },
                ].map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      const newIds = new Set(field.state.value || []);
                      if (newIds.has(category.id)) {
                        newIds.delete(category.id);
                      } else if (newIds.size < 5) {
                        newIds.add(category.id);
                      }
                      field.setValue(Array.from(newIds));
                    }}
                    className="p-3 rounded-lg border border-muted flex-row items-center gap-3"
                  >
                    <Checkbox
                      isSelected={(field.state.value || []).includes(
                        category.id,
                      )}
                      onSelectedChange={(selected) => {
                        const newIds = new Set(field.state.value || []);
                        if (selected) {
                          if (newIds.size < 5) {
                            newIds.add(category.id);
                          }
                        } else {
                          newIds.delete(category.id);
                        }
                        field.setValue(Array.from(newIds));
                      }}
                    />
                    <Text className="flex-1 text-foreground">
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />
          {(form.state.values.categoryIds || []).length > 0 && (
            <Text className="text-xs text-muted mt-2">
              {(form.state.values.categoryIds || []).length}/5 選択
            </Text>
          )}
        </View>

        {/* Description field */}
        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">
            説明（200文字以内）
          </Text>
          <form.Field
            name="description"
            children={(field) => (
              <View>
                <TextField>
                  <Input
                    placeholder="インシデントの説明を入力してください"
                    value={field.state.value}
                    onChangeText={(text) => field.setValue(text.slice(0, 200))}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={200}
                  />
                </TextField>
                <Text className="text-xs text-muted mt-2 text-right">
                  {field.state.value.length}/200
                </Text>
              </View>
            )}
          />
        </View>

        {/* Submit button */}
        <Button
          color="primary"
          size="lg"
          fullWidth
          isLoading={createMutation.isPending}
          isDisabled={createMutation.isPending || locationStatus !== "success"}
          onPress={() => form.handleSubmit()}
          className="mb-4"
        >
          {createMutation.isPending ? "投稿中..." : "投稿する"}
        </Button>

        <Button
          variant="light"
          size="lg"
          fullWidth
          isDisabled={createMutation.isPending}
          onPress={() => router.back()}
        >
          キャンセル
        </Button>
      </ScrollView>
    </Container>
  );
}
