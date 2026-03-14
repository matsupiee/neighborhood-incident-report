import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View className="mb-6">
      <Text className="text-base font-semibold text-gray-800 mb-2">{title}</Text>
      <Text className="text-sm text-gray-600 leading-6">{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-[#f8f9fa]"
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
    >
      <Text className="text-2xl font-bold text-gray-800 mb-1">
        [サービス名] プライバシーポリシー
      </Text>
      <Text className="text-sm text-gray-400 mb-2">最終更新日：2026年3月15日</Text>
      <Text className="text-sm text-gray-600 leading-6 mb-8">
        {
          "[運営者名]（以下「運営者」）は、[サービス名]（以下「本サービス」）におけるユーザーの個人情報の取り扱いについて、以下のとおり定めます。"
        }
      </Text>

      <Section title="1. 収集する情報">
        {
          "【アカウント情報】\n・メールアドレス（認証・連絡のため）\n・表示名\n\n【投稿情報】\n・インシデントの説明文（最大200文字）\n・時間帯（6区分のいずれか：深夜・朝・昼・夕方・夜・深夜）\n・エリアコード（位置情報をメッシュコードに変換したもの。約1km四方の精度）\n・画像（モザイク処理・EXIF削除済みのもののみ保存）\n・カテゴリ\n\n【収集しない情報】\n・氏名・本名\n・生の緯度経度（メッシュコードに変換後、即時破棄）\n・顔画像・ナンバープレート情報（自動モザイク処理後、原本は保存しない）\n・位置情報の履歴（投稿時のみ使用、継続的な追跡はしない）"
        }
      </Section>

      <Section title="2. 情報の利用目的">
        {
          "収集した情報は以下の目的のみに使用します：\n・本サービスの提供・運営・改善\n・不正利用の検知・防止\n・コンテンツのモデレーション"
        }
      </Section>

      <Section title="3. 第三者への提供">
        {
          "以下の場合を除き、収集した情報を第三者に提供・販売しません：\n・法令に基づく場合（警察等公的機関からの要請）\n・ユーザー本人の同意がある場合"
        }
      </Section>

      <Section title="4. データの保存・削除">
        {
          "・投稿データはサービス運営のために保存されます。\n・アカウントを削除した場合、個人を特定できる情報（メールアドレス等）は削除されます。投稿データは匿名化した上で統計目的で保持する場合があります。"
        }
      </Section>

      <Section title="5. セキュリティ">
        {
          "個人情報への不正アクセス・漏洩を防ぐため、適切なセキュリティ対策を講じます。ただし、完全なセキュリティを保証するものではありません。"
        }
      </Section>

      <Section title="6. プライバシーポリシーの変更">
        {"本ポリシーは必要に応じて変更する場合があります。変更はアプリ内で通知します。"}
      </Section>

      <View className="mt-4 pt-6 border-t border-gray-200">
        <Text className="text-sm font-semibold text-gray-700 mb-2">7. お問い合わせ</Text>
        <Text className="text-sm text-gray-500">[運営者名]</Text>
        <Text className="text-sm text-gray-500 mt-1">メール：[メールアドレス]</Text>
      </View>
    </ScrollView>
  );
}
