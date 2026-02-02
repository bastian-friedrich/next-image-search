/*
  Warnings:

  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Image";

-- CreateTable
CREATE TABLE "Images" (
    "id" SERIAL NOT NULL,
    "suchtext" TEXT NOT NULL,
    "bildnummer" TEXT NOT NULL,
    "fotografen" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "hoehe" INTEGER NOT NULL,
    "breite" INTEGER NOT NULL,

    CONSTRAINT "Images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Images_bildnummer_key" ON "Images"("bildnummer");

-- CreateIndex
CREATE INDEX "Images_suchtext_fotografen_bildnummer_idx" ON "Images"("suchtext", "fotografen", "bildnummer");

-- CreateIndex
CREATE INDEX "Images_suchtext_idx" ON "Images"("suchtext");

-- CreateIndex
CREATE INDEX "Images_fotografen_idx" ON "Images"("fotografen");
