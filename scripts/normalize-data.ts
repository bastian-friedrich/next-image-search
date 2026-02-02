import "dotenv/config";
import prisma from "@/lib/prisma";

const NORMALIZE_VERSION = 4;

// Extract restriction token from suchtext
function extractRestriction(suchtext: string): string | null {
  const match = suchtext.match(
    /(^|[^A-Z0-9_])PUBLICATIONxINx(?:[A-Z]{3}x)+ONLY([^A-Z0-9_]|$)/,
  );
  return match ? match[0].trim() : null;
}

const DATE_REGEX = /\b\d{1,2}\.\d{1,2}\.\d{4}\b/;

function findDateIndex(suchtext: string): number {
  const m = DATE_REGEX.exec(suchtext);
  return m?.index ?? -1;
}

function parseNamesAndLocation(suchtext: string): {
  people: string[];
  location: string | null;
} {
  const dateIndex = findDateIndex(suchtext);
  const preDate = (
    dateIndex >= 0 ? suchtext.slice(0, dateIndex) : suchtext
  ).trim();

  // Split by commas, drop empty segments (handles trailing comma before date)
  const parts = preDate
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let location: string | null = null;
  let namesPart = "";

  if (parts.length >= 2) {
    location = parts[parts.length - 1];
    namesPart = parts.slice(0, -1).join(", ");
  } else if (parts.length === 1) {
    namesPart = parts[0];
  }

  // Names are comma-separated; "and" may appear but is optional
  const normalizedNames = namesPart.replace(/\s+and\s+/gi, ", ");
  const people = normalizedNames
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((name) =>
      location ? name.toLowerCase() !== location.toLowerCase() : true,
    );

  return { people: [...new Set(people)], location };
}

// Extract people names
function extractPeople(suchtext: string): string[] {
  return parseNamesAndLocation(suchtext).people;
}

// Extract locations
function extractLocations(suchtext: string): string[] {
  const { location } = parseNamesAndLocation(suchtext);
  return location ? [location] : [];
}

async function normalizeData() {
  const batchSize = 100;
  let processed = 0;

  while (true) {
    const images = await prisma.images.findMany({
      where: {
        OR: [
          { normalizeVersion: null },
          { normalizeVersion: { lt: NORMALIZE_VERSION } },
        ],
      },
      take: batchSize,
    });

    if (images.length === 0) break;

    for (const image of images) {
      const restriction = extractRestriction(image.suchtext);
      const people = extractPeople(image.suchtext);
      const locations = extractLocations(image.suchtext);

      await prisma.images.update({
        where: { id: image.id },
        data: {
          restriction,
          people,
          locations,
          normalizeVersion: NORMALIZE_VERSION,
        },
      });

      processed++;
      if (processed % 100 === 0) {
        console.log(`Processed ${processed} images...`);
      }
    }
  }

  console.log(`Normalization complete! Processed ${processed} images.`);
}

normalizeData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
