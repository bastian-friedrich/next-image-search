import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// Disable caching for real-time data
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  // Force dynamic rendering by reading headers
  headers();
  const [totals, avgTiming, commonKeywords] = await Promise.all([
    prisma.searchLog.count(),
    prisma.searchLog.aggregate({
      _avg: { responseMs: true },
    }),
    prisma.searchLog.groupBy({
      by: ["query"],
      _count: { query: true },
      where: {
        query: { not: null },
      },
      orderBy: {
        _count: { query: "desc" },
      },
      take: 8,
    }),
  ]);

  const avgResponseMs = Math.round(avgTiming._avg.responseMs ?? 0);
  const topKeywords = commonKeywords
    .filter((item) => item.query)
    .map((item) => ({
      keyword: item.query as string,
      count: item._count.query,
    }));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Statistics</h1>
        <p className="text-sm text-gray-400">
          Mock data for now — backend integration comes next.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 rounded-lg bg-gray-800 p-4 shadow-md">
            <div className="text-xs font-medium text-gray-400">
              Number of searches
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {totals.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-gray-500">Last 30 days</div>
          </div>

          <div className="flex-1 rounded-lg bg-gray-800 p-4 shadow-md">
            <div className="text-xs font-medium text-gray-400">
              Avg. query response time
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {avgResponseMs} ms
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Server-side timing per request
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gray-800 p-4 shadow-md">
          <div className="text-xs font-medium text-gray-400">
            Most common search queries
          </div>
          <ul className="mt-3 space-y-2">
            {topKeywords.length === 0 ? (
              <li className="rounded-md bg-gray-700/60 px-3 py-2 text-sm text-gray-300">
                No queries logged yet
              </li>
            ) : (
              topKeywords.map((item) => (
                <li
                  key={item.keyword}
                  className="flex items-center justify-between rounded-md bg-gray-700/60 px-3 py-2"
                >
                  <span className="text-sm text-gray-200">{item.keyword}</span>
                  <span className="text-xs font-medium text-gray-300">
                    {item.count}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
