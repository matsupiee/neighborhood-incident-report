import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockPostFindMany = mock(async () => []);
const mockPostFindUnique = mock(async () => null);
const mockPostUpdate = mock(async () => ({
  id: "post-1",
  status: "PUBLISHED",
  publishedAt: new Date(),
}));

mock.module("@neighborhood-incident-report/db", () => ({
  default: {
    post: {
      findMany: mockPostFindMany,
      findUnique: mockPostFindUnique,
      update: mockPostUpdate,
    },
  },
}));

const { listPendingPosts, approvePost, rejectPost, banUser } =
  await import("../../routers/moderation/moderation.service");

describe("moderation.service", () => {
  beforeEach(() => {
    mockPostFindMany.mockReset();
    mockPostFindMany.mockResolvedValue([]);
    mockPostFindUnique.mockReset();
    mockPostFindUnique.mockResolvedValue(null);
    mockPostUpdate.mockReset();
    mockPostUpdate.mockResolvedValue({
      id: "post-1",
      status: "PUBLISHED",
      publishedAt: new Date(),
    });
  });

  describe("listPendingPosts", () => {
    it("PENDING な投稿がない場合は空配列を返す", async () => {
      mockPostFindMany.mockResolvedValue([]);
      const result = await listPendingPosts();
      expect(result).toEqual([]);
    });

    it("PENDING な投稿の配列を返す", async () => {
      const posts = [
        {
          id: "post-1",
          meshCode: "53393599",
          description: "テスト投稿",
          timeRange: "DAYTIME",
          createdAt: new Date(),
          incidentCategoryPosts: [],
        },
      ];
      mockPostFindMany.mockResolvedValue(posts);
      const result = await listPendingPosts();
      expect(result).toEqual(posts);
    });

    it("Prisma に正しい where と orderBy を渡す", async () => {
      await listPendingPosts();
      expect(mockPostFindMany).toHaveBeenCalledTimes(1);
      const [args] = mockPostFindMany.mock.calls;
      expect(args?.[0]).toMatchObject({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("approvePost", () => {
    it("投稿が存在しない場合は NOT_FOUND エラーを投げる", async () => {
      mockPostFindUnique.mockResolvedValue(null);
      await expect(approvePost({ postId: "post-1" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("投稿を PUBLISHED に更新して返す", async () => {
      mockPostFindUnique.mockResolvedValue({ id: "post-1", status: "PENDING" });
      const updatedPost = {
        id: "post-1",
        status: "PUBLISHED",
        publishedAt: new Date(),
      };
      mockPostUpdate.mockResolvedValue(updatedPost);

      const result = await approvePost({ postId: "post-1" });
      expect(result).toEqual(updatedPost);
    });

    it("Prisma の update に PUBLISHED ステータスを渡す", async () => {
      mockPostFindUnique.mockResolvedValue({ id: "post-abc", status: "PENDING" });
      mockPostUpdate.mockResolvedValue({
        id: "post-abc",
        status: "PUBLISHED",
        publishedAt: new Date(),
      });

      await approvePost({ postId: "post-abc" });

      expect(mockPostFindUnique).toHaveBeenCalledTimes(1);
      const [findArgs] = mockPostFindUnique.mock.calls;
      expect(findArgs?.[0]).toMatchObject({ where: { id: "post-abc" } });

      expect(mockPostUpdate).toHaveBeenCalledTimes(1);
      const [updateArgs] = mockPostUpdate.mock.calls;
      expect(updateArgs?.[0]).toMatchObject({
        where: { id: "post-abc" },
        data: { status: "PUBLISHED" },
      });
    });

    it("approvePost の更新結果に publishedAt が含まれる", async () => {
      mockPostFindUnique.mockResolvedValue({ id: "post-1", status: "PENDING" });
      const now = new Date();
      mockPostUpdate.mockResolvedValue({
        id: "post-1",
        status: "PUBLISHED",
        publishedAt: now,
      });

      const result = await approvePost({ postId: "post-1" });
      expect(result.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe("rejectPost", () => {
    it("投稿が存在しない場合は NOT_FOUND エラーを投げる", async () => {
      mockPostFindUnique.mockResolvedValue(null);
      await expect(rejectPost({ postId: "post-1" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("投稿を HIDDEN に更新して返す", async () => {
      mockPostFindUnique.mockResolvedValue({ id: "post-1", status: "PENDING" });
      const updatedPost = { id: "post-1", status: "HIDDEN" };
      mockPostUpdate.mockResolvedValue(updatedPost);

      const result = await rejectPost({ postId: "post-1" });
      expect(result).toEqual(updatedPost);
    });

    it("Prisma の update に HIDDEN ステータスを渡す", async () => {
      mockPostFindUnique.mockResolvedValue({ id: "post-xyz", status: "PENDING" });
      mockPostUpdate.mockResolvedValue({ id: "post-xyz", status: "HIDDEN" });

      await rejectPost({ postId: "post-xyz" });

      const [updateArgs] = mockPostUpdate.mock.calls;
      expect(updateArgs?.[0]).toMatchObject({
        where: { id: "post-xyz" },
        data: { status: "HIDDEN" },
      });
    });
  });

  describe("banUser", () => {
    it("未実装エラーを投げる", async () => {
      await expect(banUser()).rejects.toThrow("banUser is not implemented yet (Phase 5-3)");
    });
  });
});
