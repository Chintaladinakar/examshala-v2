-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'approved';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'approved';

-- CreateIndex
CREATE INDEX "Exam_reviewStatus_idx" ON "Exam"("reviewStatus");

-- CreateIndex
CREATE INDEX "Question_reviewStatus_idx" ON "Question"("reviewStatus");
