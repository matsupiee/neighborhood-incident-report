/**
 * 画像処理パイプライン：EXIF除去・顔/ナンバープレートモザイク処理を実施する。
 *
 * 本実装は開発環境用の簡易版です。
 * 本番環境では以下を実装してください：
 * - TODO: sharp パッケージを使用してEXIF（JPEGのAPP1セグメント）を除去
 * - TODO: TensorFlow.js or OpenCV.js を使用して顔検出・モザイク処理
 * - TODO: 外部API（AWS Rekognition、Google Cloud Vision等）を使用してナンバープレート認識・モザイク
 * - TODO: 処理済み画像をS3等のストレージに保存して処理済み画像URLを返す
 *
 * 現在は入力URLをそのまま返す簡易実装です。
 * 実装時は以下に注意すること：
 * - 処理前の生画像（EXIF・顔情報付き）をストレージに保存しない
 * - 顔/ナンバーモザイク処理後の画像のみ保存する
 *
 * @param imageUrl - 処理対象の画像URL
 * @returns 処理済み画像のURL
 */
export async function processImage(imageUrl: string): Promise<string> {
  // TODO: 開発環境では入力をそのまま返す
  // 本番環境では以下の処理を実装:
  // 1. 画像をダウンロード
  // 2. EXIF メタデータを除去
  // 3. 顔検出・モザイク処理
  // 4. ナンバープレート検出・モザイク処理
  // 5. 処理済み画像をストレージに保存
  // 6. 処理済み画像のURLを返す

  return imageUrl;
}
