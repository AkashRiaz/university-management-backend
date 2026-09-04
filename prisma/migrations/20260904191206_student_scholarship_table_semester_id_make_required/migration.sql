/*
  Warnings:

  - Made the column `semesterId` on table `student_scholarships` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "student_scholarships" DROP CONSTRAINT "student_scholarships_semesterId_fkey";

-- AlterTable
ALTER TABLE "student_scholarships" ALTER COLUMN "semesterId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "student_scholarships" ADD CONSTRAINT "student_scholarships_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
