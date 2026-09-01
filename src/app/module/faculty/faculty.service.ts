import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateFacultyPayload } from "./faculty.interface";

const createFaculty = async (payload: ICreateFacultyPayload) => {
  const existingFaculty = await prisma.faculty.findUnique({
    where: {
      code: payload.code,
    },
  });

  if (existingFaculty) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Faculty with code ${payload.code} already exists.`,
    );
  }

  const faculty = await prisma.faculty.create({
    data: payload,
  });
  return faculty;
};

export const facultyService = {
  createFaculty,
};
