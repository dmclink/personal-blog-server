/*
  Warnings:

  - You are about to alter the column `content` on the `Comment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.

*/
-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "removed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "content" SET DATA TYPE VARCHAR(300);
