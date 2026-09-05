import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateGradeScalePayload, IUpdateGradeScalePayload } from "./gradeScale.interface";
import  httpStatus  from "http-status";

const createGradeScale = async (payload: ICreateGradeScalePayload) => {
  const existingGradeScale = await prisma.gradeScale.findFirst({
    where: {
      name: payload.name,
    },
  });

  if (existingGradeScale) {
    throw new AppError(httpStatus.CONFLICT, "Grade scale already exists");
  }

  const result = await prisma.gradeScale.create({
    data: {
      name: payload.name,
      description: payload.description,
    },

    include: {
      grades: {
        orderBy: {
          minMarks: "desc",
        },
      },
    },
  });

  return result;
};

const getAllGradeScales = async () => {
  const result = await prisma.gradeScale.findMany({
    include: {
      grades: {
        orderBy: {
          minMarks: "desc",
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const getSingleGradeScale = async (gradeScaleId: string) => {
  const result = await prisma.gradeScale.findUnique({
    where: {
      id: gradeScaleId,
    },

    include: {
      grades: {
        orderBy: {
          minMarks: "desc",
        },
      },
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Grade scale not found");
  }

  return result;
};

const updateGradeScale = async (
  gradeScaleId: string,
  payload: IUpdateGradeScalePayload,
) => {
  const existingGradeScale = await prisma.gradeScale.findUnique({
    where: {
      id: gradeScaleId,
    },
  });

  if (!existingGradeScale) {
    throw new AppError(httpStatus.NOT_FOUND, "Grade scale not found");
  }

  if (payload.name) {
    const duplicate = await prisma.gradeScale.findFirst({
      where: {
        name: payload.name,
        id: {
          not: gradeScaleId,
        },
      },
    });

    if (duplicate) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Grade scale with this name already exists",
      );
    }
  }

  const result = await prisma.gradeScale.update({
    where: {
      id: gradeScaleId,
    },

    data: payload,

    include: {
      grades: {
        orderBy: {
          minMarks: "desc",
        },
      },
    },
  });

  return result;
};

const deleteGradeScale = async (gradeScaleId: string) => {
  const existingGradeScale = await prisma.gradeScale.findUnique({
    where: {
      id: gradeScaleId,
    },
  });

  if (!existingGradeScale) {
    throw new AppError(httpStatus.NOT_FOUND, "Grade scale not found");
  }

  await prisma.gradeScale.delete({
    where: {
      id: gradeScaleId,
    },
  });

  return null;
};

export const GradeScaleService = {
  createGradeScale,
  getAllGradeScales,
  getSingleGradeScale,
  updateGradeScale,
  deleteGradeScale,
};
