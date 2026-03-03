import prisma from "@neighborhood-incident-report/db";
import { ORPCError } from "@orpc/server";

const DAILY_LIMIT = 5;

/**
 * 1日あたりの投稿件数を検証するレートリミット関数。
 * incident.create プロシージャ内で呼び出す。
 *
 * @param userId - 投稿者のユーザーID
 * @throws ORPCError("FORBIDDEN") - 1日の上限（5件）を超えている場合
 */
export async function checkPostRateLimit(userId: string): Promise<void> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.post.count({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  if (count >= DAILY_LIMIT) {
    throw new ORPCError("FORBIDDEN", {
      message: `1日の投稿上限（${DAILY_LIMIT}件）に達しています。明日以降に再投稿してください。`,
    });
  }
}
