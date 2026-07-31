-- AlterTable
ALTER TABLE "AssignmentSubmission" ADD COLUMN     "feedbackComment" TEXT,
ADD COLUMN     "marksObtained" INTEGER,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByUserId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'submitted';

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
