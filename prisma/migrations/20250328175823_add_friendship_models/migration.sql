/*
  Warnings:

  - Added the required column `updatedAt` to the `Friendship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FriendRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Friendship" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
