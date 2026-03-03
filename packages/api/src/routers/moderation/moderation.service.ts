import prisma from "@neighborhood-incident-report/db";
import { ORPCError } from "@orpc/server";

/**
 * PENDINGステータスの投稿一覧を取得する（モデレーター向け）。
 * プライバシーに配慮して userId, email, name は含めない。
 *
 * @returns PENDINGな投稿の配列
 */
export async function listPendingPosts() {
  const pendingPosts = await prisma.post.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      meshCode: true,
      description: true,
      timeRange: true,
      createdAt: true,
      // モデレーター専用: BAN操作のためにuserIdを返す
      userId: true,
      incidentCategoryPosts: {
        select: {
          incidentCategory: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  return pendingPosts;
}

/**
 * 投稿を承認する。
 * ステータスを PUBLISHED に変更し、publishedAt を現在時刻に設定する。
 *
 * @param input - 承認対象の投稿ID
 * @throws ORPCError("NOT_FOUND") - 投稿が見つからない場合
 */
export async function approvePost(input: { postId: string }) {
  const post = await prisma.post.findUnique({
    where: { id: input.postId },
    select: { id: true, status: true },
  });

  if (!post) {
    throw new ORPCError("NOT_FOUND", { message: "投稿が見つかりません" });
  }

  const updated = await prisma.post.update({
    where: { id: input.postId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    select: {
      id: true,
      status: true,
      publishedAt: true,
    },
  });

  return updated;
}

/**
 * 投稿を却下する。
 * ステータスを HIDDEN に変更する。
 *
 * @param input - 却下対象の投稿ID
 * @throws ORPCError("NOT_FOUND") - 投稿が見つからない場合
 */
export async function rejectPost(input: { postId: string }) {
  const post = await prisma.post.findUnique({
    where: { id: input.postId },
    select: { id: true, status: true },
  });

  if (!post) {
    throw new ORPCError("NOT_FOUND", { message: "投稿が見つかりません" });
  }

  const updated = await prisma.post.update({
    where: { id: input.postId },
    data: {
      status: "HIDDEN",
    },
    select: {
      id: true,
      status: true,
    },
  });

  return updated;
}

/**
 * ユーザーをBANする。
 * UserRestriction レコードを作成し、対象ユーザーの全PENDINGおよびPUBLISHED投稿をHIDDENに変更する。
 *
 * @param input - BAN対象のユーザーIDと理由
 * @throws ORPCError("NOT_FOUND") - ユーザーが見つからない場合
 */
export async function banUser(input: { userId: string; reason: string }) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });

  if (!user) {
    throw new ORPCError("NOT_FOUND", { message: "ユーザーが見つかりません" });
  }

  await prisma.$transaction([
    prisma.userRestriction.create({
      data: {
        id: crypto.randomUUID(),
        userId: input.userId,
        reason: input.reason,
        restrictedAt: new Date(),
      },
    }),
    prisma.post.updateMany({
      where: {
        userId: input.userId,
        status: { in: ["PENDING", "PUBLISHED"] },
      },
      data: { status: "HIDDEN" },
    }),
  ]);

  return { banned: true };
}

/**
 * ユーザーのBANを解除する。
 * 対象ユーザーのすべての UserRestriction レコードを削除する。
 *
 * @param input - BAN解除対象のユーザーID
 * @throws ORPCError("NOT_FOUND") - ユーザーが見つからない場合
 */
export async function unbanUser(input: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });

  if (!user) {
    throw new ORPCError("NOT_FOUND", { message: "ユーザーが見つかりません" });
  }

  await prisma.userRestriction.deleteMany({
    where: { userId: input.userId },
  });

  return { unbanned: true };
}
