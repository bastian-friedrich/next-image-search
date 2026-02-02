-- AlterTable
ALTER TABLE "Images" ADD COLUMN     "locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "people" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "restriction" TEXT;

-- CreateIndex
CREATE INDEX "Images_restriction_idx" ON "Images"("restriction");
