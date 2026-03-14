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

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-[#f8f9fa]"
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
    >
      <Text className="text-2xl font-bold text-gray-800 mb-1">[サービス名] 利用規約</Text>
      <Text className="text-sm text-gray-400 mb-8">最終更新日：2026年3月15日</Text>

      <Section title="第1条（適用）">
        {
          "本規約は、[運営者名]（以下「運営者」）が提供する[サービス名]（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意した上で本サービスを利用するものとします。"
        }
      </Section>

      <Section title="第2条（利用登録）">
        {
          "1. ユーザーはメールアドレスおよびパスワードにより利用登録を行います。\n2. 虚偽の情報による登録を禁止します。\n3. 1人につき1アカウントのみ利用できます。\n4. 18歳未満の方は保護者の同意を得た上でご利用ください。"
        }
      </Section>

      <Section title="第3条（禁止事項）">
        {
          "ユーザーは以下の行為を行ってはなりません：\n・虚偽または誤解を招くインシデントの投稿\n・他人のプライバシーを侵害する情報（氏名、住所、顔写真、ナンバープレート等）の投稿\n・特定の個人・団体への嫌がらせ・誹謗中傷\n・差別的・暴力的・性的なコンテンツの投稿\n・1日の投稿上限（5件）を回避するための複数アカウント作成\n・本サービスのシステムへの不正アクセス・改ざん・リバースエンジニアリング\n・本サービスを商業目的（宣伝・勧誘等）で利用すること"
        }
      </Section>

      <Section title="第4条（投稿コンテンツ）">
        {
          "1. 投稿内容の正確性・適切性についての責任はユーザーが負います。\n2. 位置情報は自動的に約1km四方のエリア単位に変換・匿名化されます。生の緯度経度は保存されません。\n3. 投稿に添付された画像は、顔およびナンバープレートが自動的にモザイク処理されます。\n4. 画像のEXIFメタデータ（撮影日時・機種情報等）は自動的に削除されます。\n5. 投稿は公開まで最大6時間の遅延が生じる場合があります。\n6. 運営者は、本規約に違反する投稿を予告なく削除または非公開化できるものとします。"
        }
      </Section>

      <Section title="第5条（モデレーション・アカウント停止）">
        {
          "1. 同一投稿に対して3件以上の通報が集まった場合、当該投稿を自動的に非公開化します。\n2. 本規約に違反した場合、予告なくアカウントを一時停止または削除する場合があります。\n3. アカウント停止・削除に伴う損害について、運営者は責任を負いません。"
        }
      </Section>

      <Section title="第6条（免責事項）">
        {
          "1. 投稿された情報の正確性・完全性を運営者は保証しません。\n2. 本サービスの利用により生じた損害について、運営者は責任を負いません。\n3. 緊急時（犯罪・事故・火災等）には本サービスではなく、警察（110番）・消防（119番）に通報してください。\n4. 本サービスはシステム保守等のため、予告なく一時停止する場合があります。"
        }
      </Section>

      <Section title="第7条（規約の変更）">
        {
          "運営者は必要に応じて本規約を変更できるものとします。変更後の規約はアプリ内で通知します。変更後も本サービスを継続利用した場合、変更に同意したものとみなします。"
        }
      </Section>

      <Section title="第8条（準拠法）">{"本規約は日本法に準拠するものとします。"}</Section>

      <View className="mt-4 pt-6 border-t border-gray-200">
        <Text className="text-sm text-gray-500">[運営者名]</Text>
        <Text className="text-sm text-gray-500 mt-1">お問い合わせ：[メールアドレス]</Text>
      </View>
    </ScrollView>
  );
}
