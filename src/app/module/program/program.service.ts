import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateProgramPayload } from "./program.interface";
import httpStatus from "http-status";

const createProgram = async (payload: ICreateProgramPayload) => {
  const department = await prisma.department.findUnique({
    where: {
      id: payload.departmentId,
    },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  const existingProgram = await prisma.program.findUnique({
    where: {
      departmentId_code: {
        departmentId: payload.departmentId,
        code: payload.code,
      },
    },
  });

  if (existingProgram) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Program with this code already exists in the department",
    );
  }

  // 3. Validate business rules
  if (payload.durationYears <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Duration years must be greater than 0",
    );
  }

  if (payload.totalCredits <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Total credits must be greater than 0",
    );
  }

  // 4. Create program
  const program = await prisma.program.create({
    data: {
      name: payload.name,
      code: payload.code,
      description: payload.description,
      durationYears: payload.durationYears,
      totalCredits: Number(payload.totalCredits),
      departmentId: payload.departmentId,
    },
    include: {
      department: true,
    },
  });
  return program;
};


export const ProgramService = {
  createProgram,
};
