import prisma from "@/lib/prisma";
import SearchContainer from "./components/SearchContainer";

export default async function HomePage() {
  const [uniqueCredits, uniqueRestrictions] = await Promise.all([
    prisma.images.findMany({
      select: { fotografen: true },
      distinct: ["fotografen"],
    }),
    prisma.images.findMany({
      select: { restriction: true },
      distinct: ["restriction"],
      where: {
        restriction: {
          not: null,
        },
      },
    }),
  ]);

  const credits = uniqueCredits.map((item) => item.fotografen);
  const restrictions = uniqueRestrictions
    .map((item) => item.restriction)
    .filter((r) => r !== null) as string[];

  return <SearchContainer credits={credits} restrictions={restrictions} />;
}
