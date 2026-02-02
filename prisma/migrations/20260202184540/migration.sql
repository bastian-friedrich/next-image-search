/*
  Warnings:

  - You are about to drop the column `search_vector` on the `Images` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_images_search_vector";

-- AlterTable
ALTER TABLE "Images" DROP COLUMN "search_vector";
