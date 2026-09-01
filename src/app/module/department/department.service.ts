import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateDepartmentPayload } from "./department.interface";
import httpStatus from "http-status";

const createDepartment = async (payload: ICreateDepartmentPayload) => {
    console.log("Payload received in createDepartment:", payload);
  const faculty = await prisma.faculty.findUnique({
    where: {
      id: payload.facultyId,
    },
  });

  if (!faculty) {
    throw new AppError(httpStatus.NOT_FOUND, "Faculty not found");
  }

  const existingDepartment = await prisma.department.findUnique({
    where: {
      facultyId_code: {
        facultyId: payload.facultyId,
        code: payload.code,
      },
    },
  });

  if (existingDepartment) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Department code already exists in this faculty",
    );
  }

  const department = await prisma.department.create({
    data: {
      ...payload,
    },
    include: {
      faculty: true,
    },
  });
  return department;
};

export const DepartmentService = {
  createDepartment,
};
