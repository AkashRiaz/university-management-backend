import { Prisma } from "../../../generated/prisma/client";

export const generateEmployeeId = async (
  tx: Prisma.TransactionClient,
  departmentId: string,
  year: number,
): Promise<string> => {
  const department = await tx.department.findUnique({
    where: {
      id: departmentId,
    },
    select: {
      code: true,
    },
  });

  if (!department) {
    throw new Error("Department not found");
  }

  const departmentCode = department.code.trim().toUpperCase();

  const prefix = `${departmentCode}-INS-${year}-`;

  const lastInstructor = await tx.instructorProfile.findFirst({
    where: {
      employeeId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      employeeId: "desc",
    },
    select: {
      employeeId: true,
    },
  });

  let nextNumber = 1;

  if (lastInstructor) {
    const parts = lastInstructor.employeeId.split("-");

    const lastNumber = Number(parts[parts.length - 1]);

    if (!Number.isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};
