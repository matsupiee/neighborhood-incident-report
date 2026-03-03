import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { requireModerator } from "../../middleware/require-moderator";
import type { Context } from "../../context";

function makeContext(email?: string): Context {
  if (!email) {
    return { session: null } as unknown as Context;
  }
  return {
    session: {
      user: {
        id: "user-1",
        email,
        name: "Test User",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
        trustScore: 80,
      },
      session: {
        id: "session-1",
        userId: "user-1",
        token: "test-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: null,
        userAgent: null,
      },
    },
  } as unknown as Context;
}

describe("requireModerator", () => {
  let savedEnv: string | undefined;

  beforeEach(() => {
    savedEnv = process.env["MODERATOR_EMAILS"];
  });

  afterEach(() => {
    if (savedEnv === undefined) {
      delete process.env["MODERATOR_EMAILS"];
    } else {
      process.env["MODERATOR_EMAILS"] = savedEnv;
    }
  });

  it("MODERATOR_EMAILS が未設定の場合は FORBIDDEN エラーを投げる", async () => {
    delete process.env["MODERATOR_EMAILS"];
    const ctx = makeContext("admin@example.com");
    await expect(requireModerator(ctx)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("MODERATOR_EMAILS が空文字の場合は FORBIDDEN エラーを投げる", async () => {
    process.env["MODERATOR_EMAILS"] = "";
    const ctx = makeContext("admin@example.com");
    await expect(requireModerator(ctx)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("セッションがない場合は UNAUTHORIZED エラーを投げる", async () => {
    process.env["MODERATOR_EMAILS"] = "admin@example.com";
    const ctx = makeContext();
    await expect(requireModerator(ctx)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("メールがモデレーターリストに存在しない場合は FORBIDDEN エラーを投げる", async () => {
    process.env["MODERATOR_EMAILS"] = "admin@example.com";
    const ctx = makeContext("user@example.com");
    await expect(requireModerator(ctx)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("メールがリストに一致する場合はコンテキストをそのまま返す", async () => {
    process.env["MODERATOR_EMAILS"] = "admin@example.com";
    const ctx = makeContext("admin@example.com");
    const result = await requireModerator(ctx);
    expect(result).toBe(ctx);
  });

  it("複数アドレスのリストで一致するアドレスがあればコンテキストを返す", async () => {
    process.env["MODERATOR_EMAILS"] =
      "mod1@example.com,mod2@example.com,admin@example.com";
    const ctx = makeContext("mod2@example.com");
    const result = await requireModerator(ctx);
    expect(result).toBe(ctx);
  });

  it("メールアドレスの前後スペースを除去して比較する", async () => {
    process.env["MODERATOR_EMAILS"] = "  admin@example.com  , mod@example.com ";
    const ctx = makeContext("admin@example.com");
    const result = await requireModerator(ctx);
    expect(result).toBe(ctx);
  });

  it("リストの最初のメールが一致する場合もコンテキストを返す", async () => {
    process.env["MODERATOR_EMAILS"] = "first@example.com,second@example.com";
    const ctx = makeContext("first@example.com");
    const result = await requireModerator(ctx);
    expect(result).toBe(ctx);
  });
});
