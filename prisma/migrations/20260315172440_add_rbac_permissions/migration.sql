-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'YOUTH_PASTOR';
ALTER TYPE "Role" ADD VALUE 'KIDS_PASTOR';
ALTER TYPE "Role" ADD VALUE 'WORSHIP_LEADER';
ALTER TYPE "Role" ADD VALUE 'GROUPS_DIRECTOR';
ALTER TYPE "Role" ADD VALUE 'OUTREACH_DIRECTOR';
ALTER TYPE "Role" ADD VALUE 'ACCOUNTING';
ALTER TYPE "Role" ADD VALUE 'FACILITIES';
ALTER TYPE "Role" ADD VALUE 'COMMUNICATIONS_DIRECTOR';
ALTER TYPE "Role" ADD VALUE 'VOLUNTEER_LEADER';

-- CreateTable
CREATE TABLE "UserPermissionOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPermissionOverride_userId_idx" ON "UserPermissionOverride"("userId");

-- CreateIndex
CREATE INDEX "UserPermissionOverride_churchId_idx" ON "UserPermissionOverride"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermissionOverride_userId_permission_key" ON "UserPermissionOverride"("userId", "permission");

-- AddForeignKey
ALTER TABLE "UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
