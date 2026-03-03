import { ORPCError } from "@orpc/server";
import type { Context } from "../context";

/**
 * モデレーター権限を要求するミドルウェア。
 * 環境変数 MODERATOR_EMAILS（カンマ区切り）と照合して、
 * 一致しない場合は FORBIDDEN エラーを返す。
 *
 * @param context - リクエストコンテキスト
 * @returns モデレーター権限確認済みのコンテキスト、またはエラー
 */
export async function requireModerator(context: Context) {
  // MODERATOR_EMAILS 環境変数を取得
  const moderatorEmails = process.env.MODERATOR_EMAILS || "";

  if (!moderatorEmails) {
    console.warn("WARNING: MODERATOR_EMAILS environment variable is not set");
    throw new ORPCError("FORBIDDEN", {
      message: "モデレーター権限が必要です",
    });
  }

  // ユーザーがセッションに存在しない場合（認証なし）
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  // ユーザーのメールがモデレーターのリストに存在するか確認
  const userEmail = context.session.user.email;
  const allowedEmails = moderatorEmails
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  if (!allowedEmails.includes(userEmail)) {
    throw new ORPCError("FORBIDDEN", {
      message: "モデレーター権限が必要です",
    });
  }

  return context;
}
