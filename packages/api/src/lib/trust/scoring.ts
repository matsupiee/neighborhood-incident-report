import prisma from "@neighborhood-incident-report/db";

/**
 * ユーザーのトラストスコアを計算する。
 * 初期スコアはUser.trustScoreで、HIDDENになった投稿1件につき-10点（最低0）。
 *
 * @param userId - ユーザーID
 * @returns 計算されたトラストスコア（0-100）
 */
export async function calculateTrustScore(userId: string): Promise<number> {
  // ユーザーの基本trustScoreを取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trustScore: true },
  });

  if (!user) {
    return 0;
  }

  // HIDDENになった投稿の数を数える
  const hiddenPostCount = await prisma.post.count({
    where: {
      userId,
      status: "HIDDEN",
    },
  });

  // ペナルティを計算（1件につき-10点、最低0）
  const penalty = hiddenPostCount * 10;
  const finalScore = Math.max(0, user.trustScore - penalty);

  return finalScore;
}

/**
 * スコアが高信頼値（80以上）かどうかを判定する。
 *
 * @param score - トラストスコア
 * @returns score >= 80 の場合true
 */
export function isHighTrust(score: number): boolean {
  return score >= 80;
}
