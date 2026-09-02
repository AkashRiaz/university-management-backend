import { Prisma } from "../../generated/prisma/client";

export const generateStudentId = async (
  tx: Prisma.TransactionClient,
  departmentId: string,
  admissionYear: number,
): Promise<string> => {
  const department = await tx.department.findUniqueOrThrow({
    where: { id: departmentId },
    select: { code: true },
  });

  const seq = await tx.studentIdSequence.upsert({
    where: { departmentId_year: { departmentId, year: admissionYear } },
    create: { departmentId, year: admissionYear, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  const yy = String(admissionYear).slice(-2);
  const serial = String(seq.lastNumber).padStart(4, "0");

  return `${yy}-${department.code}-${serial}`;
}
