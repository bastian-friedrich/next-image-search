import { type NextRequest, NextResponse, after } from "next/server";
import prisma from "@/lib/prisma";
import type { ImagesWhereInput } from "@/app/generated/prisma/internal/prismaNamespaceBrowser";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";

export async function GET(request: NextRequest) {
  const t0 = Date.now();

  // Get query params
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") === "asc" ? "asc" : "desc";

  // Filter params
  const credit = searchParams.get("credit")?.trim();
  const dateStr = searchParams.get("date")?.trim();
  const restrictionParams = searchParams
    .getAll("restriction")
    .map((value) => value.trim())
    .filter(Boolean);

  // Pagination params
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize")) || 50, 1),
    100,
  );

  const where: ImagesWhereInput = {
    AND: [
      ...(q
        ? [
            {
              OR: [
                {
                  suchtext: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  fotografen: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  bildnummer: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              ],
            },
          ]
        : []),
      ...(credit
        ? [
            {
              fotografen: {
                equals: credit,
                mode: "insensitive",
              },
            },
          ]
        : []),
      ...(dateStr
        ? [
            (() => {
              const parsed = parseISO(dateStr); // expects YYYY-MM-DD
              if (!isValid(parsed)) return {};
              return {
                datum: {
                  gte: startOfDay(parsed),
                  lte: endOfDay(parsed),
                },
              };
            })(),
          ]
        : []),
      ...(restrictionParams.length
        ? [
            {
              OR: restrictionParams.map((restriction) => ({
                restriction: {
                  contains: restriction,
                  mode: "insensitive",
                },
              })),
            },
          ]
        : []),
    ],
  };

  const [items, total] = await Promise.all([
    prisma.images.findMany({
      where,
      orderBy: { datum: sort },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.images.count({ where }),
  ]);

  // Log query
  const responseMs = Date.now() - t0;

  // Asynchronous logging, don't block response
  after(async () => {
    try {
      await prisma.searchLog.create({
        data: {
          query: q ?? null,
          restriction:
            restrictionParams.length > 0 ? restrictionParams.join(", ") : null,
          credit: credit ?? null,
          date: dateStr ?? null,
          page,
          pageSize,
          sort,
          responseMs,
          resultCount: total,
        },
      });
    } catch (err) {
      console.warn("searchLog failed", err);
    }
  });

  return NextResponse.json({
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    items,
  });
}
