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
 * ユーザーをBANする（Phase 5-3で実装）。
 *
 * @throws Error - 未実装機能
 */
export async function banUser() {
  throw new Error("banUser is not implemented yet (Phase 5-3)");
}
