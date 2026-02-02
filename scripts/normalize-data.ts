import "dotenv/config";
import prisma from "@/lib/prisma";

const NORMALIZE_VERSION = 1;

// Extract restriction token from suchtext
function extractRestriction(suchtext: string): string | null {
  const match = suchtext.match(
    /(^|[^A-Z0-9_])PUBLICATIONxINx(?:[A-Z]{3}x)+ONLY([^A-Z0-9_]|$)/,
  );
  return match ? match[0].trim() : null;
}

// Extract people names (customize based on your data patterns)
function extractPeople(suchtext: string): string[] {
  // Example: Extract tokens that look like names (capitalized words)
  // Adjust regex based on your actual data format
  const peoplePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
  const matches = suchtext.match(peoplePattern) || [];
  return [...new Set(matches)]; // Remove duplicates
}

// Extract locations (customize based on your data patterns)
function extractLocations(suchtext: string): string[] {
  // Example: Extract known location patterns or use a location dictionary
  // Adjust based on your actual data format
  const locationPattern =
    /\b(?:in|bei|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
  const matches = [...suchtext.matchAll(locationPattern)];
  const locations = matches.map((m) => m[1]);
  return [...new Set(locations)]; // Remove duplicates
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
