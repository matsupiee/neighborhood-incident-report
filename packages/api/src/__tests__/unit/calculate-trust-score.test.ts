import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockUserFindUnique = mock(async () => ({ trustScore: 80 }));
const mockPostCount = mock(async () => 0);

mock.module("@neighborhood-incident-report/db", () => ({
  default: {
    user: { findUnique: mockUserFindUnique },
    post: { count: mockPostCount },
  },
}));

const { calculateTrustScore } = await import("../../lib/trust/scoring");

describe("calculateTrustScore", () => {
  beforeEach(() => {
    mockUserFindUnique.mockReset();
    mockUserFindUnique.mockResolvedValue({ trustScore: 80 });
    mockPostCount.mockReset();
    mockPostCount.mockResolvedValue(0);
  });

  it("ユーザーが存在しない場合は 0 を返す", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const score = await calculateTrustScore("user-1");
    expect(score).toBe(0);
  });

  it("HIDDEN な投稿がない場合は基本スコアをそのまま返す", async () => {
    mockUserFindUnique.mockResolvedValue({ trustScore: 80 });
    mockPostCount.mockResolvedValue(0);
    const score = await calculateTrustScore("user-1");
    expect(score).toBe(80);
  });

  it("HIDDEN 投稿 1 件につき -10 点のペナルティが適用される", async () => {
    mockUserFindUnique.mockResolvedValue({ trustScore: 80 });
    mockPostCount.mockResolvedValue(2);
    const score = await calculateTrustScore("user-1");
    expect(score).toBe(60); // 80 - 2*10 = 60
  });

  it("スコアが 0 未満にならない（下限は 0）", async () => {
    mockUserFindUnique.mockResolvedValue({ trustScore: 30 });
    mockPostCount.mockResolvedValue(5); // penalty = 50 > 30
    const score = await calculateTrustScore("user-1");
    expect(score).toBe(0);
  });

  it("trustScore が 0 で HIDDEN 投稿なしの場合も 0 を返す", async () => {
    mockUserFindUnique.mockResolvedValue({ trustScore: 0 });
    mockPostCount.mockResolvedValue(0);
    const score = await calculateTrustScore("user-1");
    expect(score).toBe(0);
  });

  it("Prisma に正しいユーザー ID と HIDDEN フィルタが渡される", async () => {
    mockUserFindUnique.mockResolvedValue({ trustScore: 100 });
    mockPostCount.mockResolvedValue(0);

    await calculateTrustScore("user-abc-123");

    expect(mockUserFindUnique).toHaveBeenCalledTimes(1);
    const [userCallArgs] = mockUserFindUnique.mock.calls;
    expect(userCallArgs?.[0]).toMatchObject({ where: { id: "user-abc-123" } });

    expect(mockPostCount).toHaveBeenCalledTimes(1);
    const [countCallArgs] = mockPostCount.mock.calls;
    expect(countCallArgs?.[0]).toMatchObject({
      where: { userId: "user-abc-123", status: "HIDDEN" },
    });
  });
});
