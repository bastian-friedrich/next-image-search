import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const images = await prisma.images.findMany({
    where: q
      ? {
          OR: [
            { suchtext: { contains: q, mode: "insensitive" } },
            { fotografen: { contains: q, mode: "insensitive" } },
            { bildnummer: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    take: 50,
    orderBy: { datum: "desc" },
  });

  return NextResponse.json(images);
}
