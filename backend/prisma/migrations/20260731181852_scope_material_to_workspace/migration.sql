/*
  Warnings:

  - You are about to drop the column `uploadedBy` on the `Material` table. All the data in the column will be lost.
  - Added the required column `uploadedByUserId` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `Material` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Material" DROP COLUMN "uploadedBy",
ADD COLUMN     "chapter" TEXT,
ADD COLUMN     "classId" TEXT,
ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "topic" TEXT,
ADD COLUMN     "uploadedByUserId" TEXT NOT NULL,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'published',
ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Material_workspaceId_idx" ON "Material"("workspaceId");

-- CreateIndex
CREATE INDEX "Material_classId_idx" ON "Material"("classId");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
