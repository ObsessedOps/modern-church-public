-- CreateEnum
CREATE TYPE "GrowthTrackStep" AS ENUM ('CONNECT', 'DISCOVER', 'SERVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GrowthTrackStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'STALLED', 'DROPPED');

-- CreateTable
CREATE TABLE "GrowthTrack" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "campusId" TEXT,
    "memberId" TEXT NOT NULL,
    "currentStep" "GrowthTrackStep" NOT NULL DEFAULT 'CONNECT',
    "status" "GrowthTrackStatus" NOT NULL DEFAULT 'ACTIVE',
    "connectStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectCompletedAt" TIMESTAMP(3),
    "discoverStartedAt" TIMESTAMP(3),
    "discoverCompletedAt" TIMESTAMP(3),
    "serveStartedAt" TIMESTAMP(3),
    "serveCompletedAt" TIMESTAMP(3),
    "facilitatorId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GrowthTrack_churchId_idx" ON "GrowthTrack"("churchId");

-- CreateIndex
CREATE INDEX "GrowthTrack_campusId_idx" ON "GrowthTrack"("campusId");

-- CreateIndex
CREATE INDEX "GrowthTrack_memberId_idx" ON "GrowthTrack"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "GrowthTrack_memberId_churchId_key" ON "GrowthTrack"("memberId", "churchId");

-- AddForeignKey
ALTER TABLE "GrowthTrack" ADD CONSTRAINT "GrowthTrack_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthTrack" ADD CONSTRAINT "GrowthTrack_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthTrack" ADD CONSTRAINT "GrowthTrack_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
