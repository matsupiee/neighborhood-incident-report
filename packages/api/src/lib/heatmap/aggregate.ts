import prisma from "@neighborhood-incident-report/db";

// 最低6時間前に公開されたデータのみ集計
const HEATMAP_DELAY_MS = 6 * 60 * 60 * 1000;

export type HeatmapFilter = {
  categoryId?: string;
  since?: number; // UNIX タイムスタンプ ms
};

export type HeatmapCell = {
  meshCode: string;
  count: number;
};

/**
 * ヒートマップ集計を実行する。
 * 6時間遅延保証。カテゴリ・期間フィルター対応。
 */
export async function aggregateHeatmap(filter: HeatmapFilter): Promise<HeatmapCell[]> {
  const cutoff = new Date(Date.now() - HEATMAP_DELAY_MS);
  const sinceDate = filter.since ? new Date(filter.since) : undefined;

  if (filter.categoryId) {
    // カテゴリフィルターあり: 対象投稿を取得してメッシュコード集計
    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: {
          lte: cutoff,
          ...(sinceDate && { gte: sinceDate }),
        },
        incidentCategoryPosts: {
          some: { incidentCategoryId: filter.categoryId },
        },
      },
      select: { meshCode: true },
    });

    const counts = new Map<string, number>();
    for (const post of posts) {
      counts.set(post.meshCode, (counts.get(post.meshCode) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([meshCode, count]) => ({ meshCode, count }));
  }

  // カテゴリフィルターなし: groupBy で効率的に集計
  const grouped = await prisma.post.groupBy({
    by: ["meshCode"],
    where: {
      status: "PUBLISHED",
      publishedAt: {
        lte: cutoff,
        ...(sinceDate && { gte: sinceDate }),
      },
    },
    _count: { meshCode: true },
  });

  return grouped.map((row) => ({
    meshCode: row.meshCode,
    count: row._count.meshCode,
  }));
}
