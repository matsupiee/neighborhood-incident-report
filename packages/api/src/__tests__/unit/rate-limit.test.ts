import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockPostCount = mock(async () => 0);

mock.module("@neighborhood-incident-report/db", () => ({
  default: {
    post: {
      count: mockPostCount,
    },
  },
}));

const { checkPostRateLimit } = await import("../../middleware/rate-limit");

describe("checkPostRateLimit", () => {
  beforeEach(() => {
    mockPostCount.mockReset();
    mockPostCount.mockResolvedValue(0);
  });

  it("投稿数が0件の場合はエラーを投げない", async () => {
    mockPostCount.mockResolvedValue(0);
    await expect(checkPostRateLimit("user-1")).resolves.toBeUndefined();
  });

  it("投稿数が4件（上限未満）の場合はエラーを投げない", async () => {
    mockPostCount.mockResolvedValue(4);
    await expect(checkPostRateLimit("user-1")).resolves.toBeUndefined();
  });

  it("投稿数が上限（5件）に達した場合は FORBIDDEN エラーを投げる", async () => {
    mockPostCount.mockResolvedValue(5);
    await expect(checkPostRateLimit("user-1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("投稿数が上限を超えた場合も FORBIDDEN エラーを投げる", async () => {
    mockPostCount.mockResolvedValue(10);
    await expect(checkPostRateLimit("user-1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("Prisma の count に正しいユーザーID と日時フィルタが渡される", async () => {
    mockPostCount.mockResolvedValue(0);
    const userId = "user-abc-123";
    await checkPostRateLimit(userId);
    expect(mockPostCount).toHaveBeenCalledTimes(1);
    const [callArgs] = mockPostCount.mock.calls;
    expect(callArgs?.[0]).toMatchObject({
      where: {
        userId,
        createdAt: { gte: expect.any(Date) },
      },
    });
  });

  it("エラーメッセージに上限件数が含まれている", async () => {
    mockPostCount.mockResolvedValue(5);
    await expect(checkPostRateLimit("user-1")).rejects.toMatchObject({
      message: expect.stringContaining("5"),
    });
  });
});
