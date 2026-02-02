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

  // Build filter conditions for WHERE clause
  const filters: string[] = [];
  const filterParams: any[] = [];
  let paramIndex = 4; // Start at 4 because $1=q, $2=pageSize, $3=offset

  // Date filter
  if (dateStr) {
    const parsed = parseISO(dateStr);
    if (isValid(parsed)) {
      filters.push(
        `"datum" >= $${paramIndex} AND "datum" <= $${paramIndex + 1}`,
      );
      filterParams.push(startOfDay(parsed), endOfDay(parsed));
      paramIndex += 2;
    }
  }

  // Credit (photographer) filter
  if (credit) {
    filters.push(`LOWER("fotografen") = LOWER($${paramIndex})`);
    filterParams.push(credit);
    paramIndex += 1;
  }

  // Restrictions filter
  if (restrictionParams.length > 0) {
    const placeholders = restrictionParams
      .map((_, i) => `$${paramIndex + i}`)
      .join(", ");
    filters.push(`LOWER("restriction") IN (${placeholders})`);
    filterParams.push(...restrictionParams.map((r) => r.toLowerCase()));
    paramIndex += restrictionParams.length;
  }

  let items: any[];
  let total: number;

  // If there's a search query, use PostgreSQL FTS with ranking
  if (q && q.length > 0) {
    const searchFilter =
      filters.length > 0 ? `AND ${filters.join(" AND ")}` : "";

    const offset = (page - 1) * pageSize;

    // Build count query filter (params start at $2 since $1 is the query)
    const countFilters: string[] = [];
    let countParamIndex = 2;

    if (dateStr) {
      const parsed = parseISO(dateStr);
      if (isValid(parsed)) {
        countFilters.push(
          `"datum" >= $${countParamIndex} AND "datum" <= $${countParamIndex + 1}`,
        );
        countParamIndex += 2;
      }
    }

    if (credit) {
      countFilters.push(`LOWER("fotografen") = LOWER($${countParamIndex})`);
      countParamIndex += 1;
    }

    if (restrictionParams.length > 0) {
      const placeholders = restrictionParams
        .map((_, i) => `$${countParamIndex + i}`)
        .join(", ");
      countFilters.push(`LOWER("restriction") IN (${placeholders})`);
    }

    const countSearchFilter =
      countFilters.length > 0 ? `AND ${countFilters.join(" AND ")}` : "";

    // Query with combined FTS index (searches suchtext, fotografen, bildnummer with weights)
    const queryParams = [q, pageSize, offset, ...filterParams];

    const itemsResult = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT 
        id, "bildnummer", fotografen, suchtext, datum, hoehe, breite, restriction,
        ts_rank(
          setweight(to_tsvector('english', COALESCE(suchtext, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(fotografen, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE("bildnummer", '')), 'C'),
          plainto_tsquery('english', $1)
        ) AS rank
      FROM "Images"
      WHERE (
        setweight(to_tsvector('english', COALESCE(suchtext, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(fotografen, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE("bildnummer", '')), 'C')
      ) @@ plainto_tsquery('english', $1)
      ${searchFilter}
      ORDER BY rank DESC, "datum" ${sort}
      LIMIT $2 OFFSET $3
      `,
      ...queryParams,
    );

    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `
      SELECT COUNT(*) as count
      FROM "Images"
      WHERE (
        setweight(to_tsvector('english', COALESCE(suchtext, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(fotografen, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE("bildnummer", '')), 'C')
      ) @@ plainto_tsquery('english', $1)
      ${countSearchFilter}
      `,
      q,
      ...filterParams,
    );

    items = itemsResult.map(({ rank, ...item }) => item); // Remove rank from response
    total = Number(countResult[0].count);
  } else {
    // No search query, just use regular filtering with Prisma
    const where: ImagesWhereInput = {
      ...(credit && {
        fotografen: { equals: credit, mode: "insensitive" },
      }),

      ...(dateStr &&
        (() => {
          const parsed = parseISO(dateStr);
          if (!isValid(parsed)) return {};
          return {
            datum: {
              gte: startOfDay(parsed),
              lte: endOfDay(parsed),
            },
          };
        })()),

      ...(restrictionParams.length && {
        restriction: {
          in: restrictionParams,
          mode: "insensitive",
        },
      }),
    };

    [items, total] = await Promise.all([
      prisma.images.findMany({
        where,
        orderBy: { datum: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.images.count({ where }),
    ]);
  }

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
