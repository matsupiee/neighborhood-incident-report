import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockCheckPostRateLimit = mock(async () => undefined);
const mockToMeshCode = mock(() => "53393599");
const mockFilterText = mock(() => ({
  ok: true as const,
  filtered: "テスト投稿",
  reason: undefined,
}));
const mockCalculateTrustScore = mock(async () => 80);
const mockIsHighTrust = mock(() => true);

const mockPostCreate = mock(async () => ({
  id: "post-1",
  meshCode: "53393599",
  description: "テスト投稿",
  timeRange: "DAYTIME",
  status: "PENDING",
  createdAt: new Date(),
}));
const mockPostFindMany = mock(async () => []);
const mockPostFindUnique = mock(async () => null);
const mockPostGroupBy = mock(async () => []);
const mockPostUpdate = mock(async () => ({}));
const mockIncidentCategoryFindMany = mock(async () => []);
const mockAbuseReportCreate = mock(async () => ({}));
const mockAbuseReportCount = mock(async () => 0);

mock.module("@neighborhood-incident-report/db", () => ({
  default: {
    post: {
      create: mockPostCreate,
      findMany: mockPostFindMany,
      findUnique: mockPostFindUnique,
      groupBy: mockPostGroupBy,
      update: mockPostUpdate,
    },
    incidentCategory: {
      findMany: mockIncidentCategoryFindMany,
    },
    abuseReport: {
      create: mockAbuseReportCreate,
      count: mockAbuseReportCount,
    },
  },
}));

mock.module("../../lib/mesh/convert", () => ({
  toMeshCode: mockToMeshCode,
}));

mock.module("../../lib/moderation/text-filter", () => ({
  filterText: mockFilterText,
}));

mock.module("../../lib/trust/scoring", () => ({
  calculateTrustScore: mockCalculateTrustScore,
  isHighTrust: mockIsHighTrust,
}));

mock.module("../../middleware/rate-limit", () => ({
  checkPostRateLimit: mockCheckPostRateLimit,
}));

const { createIncident, listIncidents, getHeatmap, listCategories, reportAbuse } =
  await import("../../routers/incident/incident.service");

const BASE_CREATE_INPUT = {
  latitude: 35.6762,
  longitude: 139.6503,
  timeRange: "DAYTIME" as const,
  categoryIds: ["cat-1"],
  description: "テスト投稿",
};

describe("incident.service", () => {
  beforeEach(() => {
    mockCheckPostRateLimit.mockReset();
    mockCheckPostRateLimit.mockResolvedValue(undefined);
    mockToMeshCode.mockReset();
    mockToMeshCode.mockReturnValue("53393599");
    mockFilterText.mockReset();
    mockFilterText.mockReturnValue({
      ok: true as const,
      filtered: "テスト投稿",
      reason: undefined,
    });
    mockCalculateTrustScore.mockReset();
    mockCalculateTrustScore.mockResolvedValue(80);
    mockIsHighTrust.mockReset();
    mockIsHighTrust.mockReturnValue(true);
    mockPostCreate.mockReset();
    mockPostCreate.mockResolvedValue({
      id: "post-1",
      meshCode: "53393599",
      description: "テスト投稿",
      timeRange: "DAYTIME",
      status: "PENDING",
      createdAt: new Date(),
    });
    mockPostFindMany.mockReset();
    mockPostFindMany.mockResolvedValue([]);
    mockPostFindUnique.mockReset();
    mockPostFindUnique.mockResolvedValue(null);
    mockPostGroupBy.mockReset();
    mockPostGroupBy.mockResolvedValue([]);
    mockPostUpdate.mockReset();
    mockPostUpdate.mockResolvedValue({});
    mockIncidentCategoryFindMany.mockReset();
    mockIncidentCategoryFindMany.mockResolvedValue([]);
    mockAbuseReportCreate.mockReset();
    mockAbuseReportCreate.mockResolvedValue({});
    mockAbuseReportCount.mockReset();
    mockAbuseReportCount.mockResolvedValue(0);
  });

  describe("createIncident", () => {
    it("レートリミット超過の場合はエラーを伝播する", async () => {
      mockCheckPostRateLimit.mockRejectedValue({ code: "FORBIDDEN" });
      await expect(
        createIncident(BASE_CREATE_INPUT, "user-1"),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("NGワードフィルタが拒否した場合は BAD_REQUEST を投げる", async () => {
      mockFilterText.mockReturnValue({
        ok: false as const,
        filtered: "",
        reason: "個人情報が含まれています",
      });
      await expect(
        createIncident(BASE_CREATE_INPUT, "user-1"),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("トラストスコアが高い場合は publishedAt に6時間後の日時を設定する", async () => {
      mockIsHighTrust.mockReturnValue(true);
      const before = Date.now();
      await createIncident(BASE_CREATE_INPUT, "user-1");
      const after = Date.now();

      expect(mockPostCreate).toHaveBeenCalledTimes(1);
      const [createArgs] = mockPostCreate.mock.calls;
      const publishedAt = createArgs?.[0]?.data?.publishedAt as Date;
      expect(publishedAt).toBeInstanceOf(Date);

      const msFromNow = publishedAt.getTime() - before;
      const expectedMs = 6 * 60 * 60 * 1000;
      expect(msFromNow).toBeGreaterThanOrEqual(expectedMs - 100);
      expect(msFromNow).toBeLessThanOrEqual(expectedMs + (after - before) + 100);
    });

    it("トラストスコアが低い場合は publishedAt を null に設定する", async () => {
      mockIsHighTrust.mockReturnValue(false);
      await createIncident(BASE_CREATE_INPUT, "user-1");

      const [createArgs] = mockPostCreate.mock.calls;
      expect(createArgs?.[0]?.data?.publishedAt).toBeNull();
    });

    it("緯度経度を meshCode に変換して Prisma に渡す", async () => {
      mockToMeshCode.mockReturnValue("12345678");
      await createIncident(BASE_CREATE_INPUT, "user-1");

      expect(mockToMeshCode).toHaveBeenCalledWith(
        BASE_CREATE_INPUT.latitude,
        BASE_CREATE_INPUT.longitude,
      );
      const [createArgs] = mockPostCreate.mock.calls;
      expect(createArgs?.[0]?.data?.meshCode).toBe("12345678");
    });

    it("status: PENDING で Post を作成する", async () => {
      await createIncident(BASE_CREATE_INPUT, "user-1");
      const [createArgs] = mockPostCreate.mock.calls;
      expect(createArgs?.[0]?.data?.status).toBe("PENDING");
    });

    it("フィルタ後のテキストを description に設定する", async () => {
      mockFilterText.mockReturnValue({
        ok: true as const,
        filtered: "フィルタ済みテキスト",
        reason: undefined,
      });
      await createIncident(BASE_CREATE_INPUT, "user-1");

      const [createArgs] = mockPostCreate.mock.calls;
      expect(createArgs?.[0]?.data?.description).toBe("フィルタ済みテキスト");
    });
  });

  describe("listIncidents", () => {
    it("空のリストを返す", async () => {
      mockPostFindMany.mockResolvedValue([]);
      const result = await listIncidents({ limit: 20 });
      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeUndefined();
    });

    it("PUBLISHED ステータスのみ取得する", async () => {
      await listIncidents({ limit: 20 });
      const [args] = mockPostFindMany.mock.calls;
      expect(args?.[0]).toMatchObject({
        where: { status: "PUBLISHED" },
      });
    });

    it("投稿数が limit を超える場合は nextCursor を返す", async () => {
      const posts = Array.from({ length: 21 }, (_, i) => ({
        id: `post-${i + 1}`,
        meshCode: "53393599",
        description: `テスト${i + 1}`,
        timeRange: "DAYTIME",
        publishedAt: new Date(),
        incidentCategoryPosts: [],
      }));
      mockPostFindMany.mockResolvedValue(posts);

      const result = await listIncidents({ limit: 20 });
      expect(result.items).toHaveLength(20);
      expect(result.nextCursor).toBe("post-20");
    });

    it("投稿数が limit 以下の場合は nextCursor を返さない", async () => {
      const posts = Array.from({ length: 5 }, (_, i) => ({
        id: `post-${i + 1}`,
        meshCode: "53393599",
        description: `テスト${i + 1}`,
        timeRange: "DAYTIME",
        publishedAt: new Date(),
        incidentCategoryPosts: [],
      }));
      mockPostFindMany.mockResolvedValue(posts);

      const result = await listIncidents({ limit: 20 });
      expect(result.items).toHaveLength(5);
      expect(result.nextCursor).toBeUndefined();
    });

    it("cursor がある場合は skip: 1 を渡す", async () => {
      await listIncidents({ limit: 20, cursor: "post-5" });
      const [args] = mockPostFindMany.mock.calls;
      expect(args?.[0]).toMatchObject({
        cursor: { id: "post-5" },
        skip: 1,
      });
    });
  });

  describe("listCategories", () => {
    it("カテゴリ一覧を返す", async () => {
      const categories = [
        { id: "cat-1", name: "不審者" },
        { id: "cat-2", name: "交通事故" },
      ];
      mockIncidentCategoryFindMany.mockResolvedValue(categories);

      const result = await listCategories();
      expect(result).toEqual(categories);
    });

    it("カテゴリが存在しない場合は空配列を返す", async () => {
      mockIncidentCategoryFindMany.mockResolvedValue([]);
      const result = await listCategories();
      expect(result).toEqual([]);
    });
  });

  describe("getHeatmap", () => {
    it("結果を meshCode と count の配列で返す", async () => {
      mockPostGroupBy.mockResolvedValue([
        { meshCode: "53393599", _count: { meshCode: 3 } },
        { meshCode: "53393500", _count: { meshCode: 1 } },
      ]);

      const result = await getHeatmap({});
      expect(result).toEqual([
        { meshCode: "53393599", count: 3 },
        { meshCode: "53393500", count: 1 },
      ]);
    });

    it("データがない場合は空配列を返す", async () => {
      mockPostGroupBy.mockResolvedValue([]);
      const result = await getHeatmap({});
      expect(result).toEqual([]);
    });

    it("PUBLISHED ステータスの投稿のみ集計する", async () => {
      await getHeatmap({});
      const [args] = mockPostGroupBy.mock.calls;
      expect(args?.[0]).toMatchObject({
        where: { status: "PUBLISHED" },
      });
    });

    it("since パラメータがある場合は gte フィルタを追加する", async () => {
      const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
      await getHeatmap({ since: sinceMs });
      const [args] = mockPostGroupBy.mock.calls;
      expect(args?.[0]?.where?.publishedAt).toMatchObject({
        gte: expect.any(Date),
      });
    });
  });

  describe("reportAbuse", () => {
    it("投稿が存在しない場合は NOT_FOUND エラーを投げる", async () => {
      mockPostFindUnique.mockResolvedValue(null);
      await expect(
        reportAbuse({ postId: "post-1", reason: "HARASSMENT" }, "user-1"),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("HIDDEN の投稿を通報した場合は BAD_REQUEST エラーを投げる", async () => {
      mockPostFindUnique.mockResolvedValue({ id: "post-1", status: "HIDDEN" });
      await expect(
        reportAbuse({ postId: "post-1", reason: "FALSE_REPORT" }, "user-1"),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("通報を作成して { reported: true } を返す", async () => {
      mockPostFindUnique.mockResolvedValue({ id: "post-1", status: "PUBLISHED" });
      mockAbuseReportCount.mockResolvedValue(1);

      const result = await reportAbuse(
        { postId: "post-1", reason: "PERSONAL_INFO" },
        "user-1",
      );
      expect(result).toEqual({ reported: true });
    });

    it("通報件数が閾値（3件）未満の場合は投稿を HIDDEN にしない", async () => {
      mockPostFindUnique.mockResolvedValue({ id: "post-1", status: "PUBLISHED" });
      mockAbuseReportCount.mockResolvedValue(2);

      await reportAbuse({ postId: "post-1", reason: "OTHER" }, "user-1");
      expect(mockPostUpdate).not.toHaveBeenCalled();
    });

    it("通報件数が閾値（3件）以上の場合は投稿を HIDDEN に変更する", async () => {
      mockPostFindUnique.mockResolvedValue({ id: "post-1", status: "PUBLISHED" });
      mockAbuseReportCount.mockResolvedValue(3);

      await reportAbuse({ postId: "post-1", reason: "HARASSMENT" }, "user-1");
      expect(mockPostUpdate).toHaveBeenCalledTimes(1);
      const [updateArgs] = mockPostUpdate.mock.calls;
      expect(updateArgs?.[0]).toMatchObject({
        where: { id: "post-1" },
        data: { status: "HIDDEN" },
      });
    });

    it("AbuseReport に正しい postId, userId, reason を渡す", async () => {
      mockPostFindUnique.mockResolvedValue({ id: "post-abc", status: "PUBLISHED" });
      mockAbuseReportCount.mockResolvedValue(0);

      await reportAbuse(
        { postId: "post-abc", reason: "FALSE_REPORT" },
        "user-xyz",
      );

      expect(mockAbuseReportCreate).toHaveBeenCalledTimes(1);
      const [createArgs] = mockAbuseReportCreate.mock.calls;
      expect(createArgs?.[0]).toMatchObject({
        data: {
          postId: "post-abc",
          userId: "user-xyz",
          reason: "FALSE_REPORT",
        },
      });
    });
  });
});
