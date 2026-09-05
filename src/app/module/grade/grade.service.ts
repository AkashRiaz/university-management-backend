import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateGradePayload, IUpdateGradePayload } from "./grade.interface";
import httpStatus from "http-status";

const createGrade = async (payload: ICreateGradePayload) => {
  const gradeScale = await prisma.gradeScale.findUnique({
    where: {
      id: payload.gradeScaleId,
    },
  });

  if (!gradeScale) {
    throw new AppError(httpStatus.NOT_FOUND, "Grade scale not found");
  }

  if (payload.minMarks > payload.maxMarks) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Minimum marks cannot be greater than maximum marks",
    );
  }

  const existingGrade = await prisma.grade.findUnique({
    where: {
      gradeScaleId_letter: {
        gradeScaleId: payload.gradeScaleId,
        letter: payload.letter,
      },
    },
  });

  if (existingGrade) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This grade letter already exists in this grade scale",
    );
  }

  const result = await prisma.grade.create({
    data: {
      letter: payload.letter,
      minMarks: payload.minMarks,
      maxMarks: payload.maxMarks,
      gradePoint: payload.gradePoint,
      type: payload.type,
      gradeScaleId: payload.gradeScaleId,
    },

    include: {
      gradeScale: true,
    },
  });

  return result;
};

const getGradesByGradeScale = async (gradeScaleId: string) => {
  const gradeScale = await prisma.gradeScale.findUnique({
    where: {
      id: gradeScaleId,
    },
  });

  if (!gradeScale) {
    throw new AppError(httpStatus.NOT_FOUND, "Grade scale not found");
  }

  const result = await prisma.grade.findMany({
    where: {
      gradeScaleId,
    },

    orderBy: {
      minMarks: "desc",
    },
  });

  return result;
};

const getSingleGrade = async (id: string) => {
  const result = await prisma.grade.findUnique({
    where: {
      id: id,
    },

    include: {
      gradeScale: true,
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Grade not found");
  }

  return result;
};

const updateGrade = async (id: string, payload: IUpdateGradePayload) => {
  const existingGrade = await prisma.grade.findUnique({
    where: {
      id: id,
    },
  });

  if (!existingGrade) {
    throw new AppError(httpStatus.NOT_FOUND, "Grade not found");
  }

  const minMarks = payload.minMarks ?? Number(existingGrade.minMarks);

  const maxMarks = payload.maxMarks ?? Number(existingGrade.maxMarks);

  if (minMarks > maxMarks) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Minimum marks cannot be greater than maximum marks",
    );
  }

  if (payload.letter) {
    const duplicate = await prisma.grade.findFirst({
      where: {
        gradeScaleId: existingGrade.gradeScaleId,

        letter: payload.letter,

        id: {
          not: id,
        },
      },
    });

    if (duplicate) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This grade letter already exists in this grade scale",
      );
    }
  }

  const result = await prisma.grade.update({
    where: {
      id: id,
    },

    data: payload,

    include: {
      gradeScale: true,
    },
  });

  return result;
};

const deleteGrade = async (id: string) => {
  const existingGrade = await prisma.grade.findUnique({
    where: {
      id: id,
    },
  });

  if (!existingGrade) {
    throw new AppError(httpStatus.NOT_FOUND, "Grade not found");
  }

  await prisma.grade.delete({
    where: {
      id: id,
    },
  });

  return null;
};

export const GradeService = {
  createGrade,
  getGradesByGradeScale,
  getSingleGrade,
  updateGrade,
  deleteGrade,
};
