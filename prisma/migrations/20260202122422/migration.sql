-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "suchtext" TEXT NOT NULL,
    "bildnummer" TEXT NOT NULL,
    "fotografen" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "hoehe" INTEGER NOT NULL,
    "breite" INTEGER NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_bildnummer_key" ON "Image"("bildnummer");

-- CreateIndex
CREATE INDEX "Image_suchtext_fotografen_bildnummer_idx" ON "Image"("suchtext", "fotografen", "bildnummer");

-- CreateIndex
CREATE INDEX "Image_suchtext_idx" ON "Image"("suchtext");

-- CreateIndex
CREATE INDEX "Image_fotografen_idx" ON "Image"("fotografen");
