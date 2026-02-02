import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ImagesWhereInput } from "@/app/generated/prisma/internal/prismaNamespaceBrowser";

export async function GET(request: NextRequest) {
  // Get query params
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const sort = searchParams.get("sort") === "asc" ? "asc" : "desc";

  // Pagination params
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize")) || 50, 1),
    100,
  );

  const where: ImagesWhereInput | undefined = q
    ? {
        OR: [
          { suchtext: { contains: q, mode: "insensitive" } },
          { fotografen: { contains: q, mode: "insensitive" } },
          { bildnummer: { contains: q, mode: "insensitive" } },
        ],
      }
    : undefined;

  const [items, total] = await Promise.all([
    prisma.images.findMany({
      where,
      orderBy: { datum: sort },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.images.count({ where }),
  ]);

  return NextResponse.json({
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    items,
  });
}
