import { faker } from "@faker-js/faker";
import "dotenv/config";
import prisma from "@/lib/prisma";

const TOTAL = 10_000;
const BATCH_SIZE = 1000;

// Pool of realistic photographers / agencies
const FOTOGRAFEN = [
  "IMAGO / United Archives International",
  "IMAGO / teutopress",
  "IMAGO / ZUMA Press",
  "IMAGO / Sven Simon",
  "IMAGO / Schöning",
  "IMAGO / Camera 4",
  "IMAGO / Brandstaetter Images",
  "IMAGO / Future Image",
  "IMAGO / HochZwei",
  "IMAGO / Eventpress",
];

// Helper to generate archive-style suchtext
function generateSuchtext(): string {
  const people = faker.person.fullName();
  const location = faker.location.city();
  const organization = faker.company.name();
  const date = faker.date
    .between({ from: "1900-01-01", to: "2024-12-31" })
    .toLocaleDateString("de-DE");

  const keywords = faker.helpers
    .arrayElements(
      [
        "PUBLICATIONxINxGERxSUIxAUTxONLY",
        "editorial use only",
        "portrait",
        "action",
        "studio",
        "concert",
        "press photo",
        "historic",
        "archive",
        "sports",
        "music",
      ],
      faker.number.int({ min: 3, max: 6 }),
    )
    .join(" ");

  return `${people}, ${organization}, ${location}, ${date} ${keywords}`;
}

async function main() {
  console.log("Seeding Images...");

  for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
    const images = Array.from({ length: BATCH_SIZE }, (_, idx) => {
      const unique = i + idx;

      return {
        suchtext: generateSuchtext(),
        bildnummer: (5_000_000_000 + unique).toString(),
        fotografen: faker.helpers.arrayElement(FOTOGRAFEN),
        datum: faker.date.between({
          from: "1900-01-01",
          to: "2024-12-31",
        }),
        hoehe: faker.number.int({ min: 600, max: 6000 }),
        breite: faker.number.int({ min: 600, max: 6000 }),
      };
    });

    await prisma.images.createMany({
      data: images,
      skipDuplicates: true,
    });

    console.log(`Inserted ${Math.min(i + BATCH_SIZE, TOTAL)} images`);
  }

  console.log("Image seeding complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
