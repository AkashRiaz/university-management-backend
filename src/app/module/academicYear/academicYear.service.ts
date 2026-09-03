import { AcademicYearWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateAcademicYearPayload,
  IUpdateAcademicYearPayload,
} from "./academicYear.interface";
import httpStatus from "http-status";

const createAcademicYear = async (payload: ICreateAcademicYearPayload) => {
  if (payload.endDate <= payload.startDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "End date must be after start date",
    );
  }

  const existingAcademicYear = await prisma.academicYear.findUnique({
    where: {
      name: payload.name,
    },
  });

  if (existingAcademicYear) {
    throw new AppError(httpStatus.CONFLICT, "Academic year already exists");
  }

  const academicYear = await prisma.academicYear.create({
    data: {
      name: payload.name,
      startDate: payload.startDate,
      endDate: payload.endDate,
    },
  });

  return academicYear;
};

const getAllAcademicYears = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || "startDate";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: AcademicYearWhereInput[] = [];

  // Search by academic year name
  if (query.searchTerm) {
    andConditions.push({
      name: {
        contains: query.searchTerm,
        mode: "insensitive",
      },
    });
  }

  const academicYears = await prisma.academicYear.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    include: {
      semesters: {
        orderBy: {
          startDate: "asc",
        },
      },
    },

    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.academicYear.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: academicYears,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAcademicYearById = async (id: string) => {
  const academicYear = await prisma.academicYear.findUnique({
    where: {
      id,
    },

    include: {
      semesters: true,
    },
  });

  if (!academicYear) {
    throw new AppError(httpStatus.NOT_FOUND, "Academic year not found");
  }

  return academicYear;
};

const updateAcademicYear = async (
  id: string,
  payload: IUpdateAcademicYearPayload,
) => {
  const academicYear = await prisma.academicYear.findUnique({
    where: {
      id,
    },
  });

  if (!academicYear) {
    throw new AppError(httpStatus.NOT_FOUND, "Academic year not found");
  }

  if (payload.name && payload.name !== academicYear.name) {
    const existingAcademicYear = await prisma.academicYear.findUnique({
      where: {
        name: payload.name,
      },
    });

    if (existingAcademicYear) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Academic year with this name already exists",
      );
    }
  }

  const startDate = payload.startDate ?? academicYear.startDate;

  const endDate = payload.endDate ?? academicYear.endDate;

  if (endDate <= startDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "End date must be after start date",
    );
  }

  const updatedAcademicYear = await prisma.academicYear.update({
    where: {
      id,
    },

    data: {
      ...(payload.name !== undefined && {
        name: payload.name,
      }),

      ...(payload.startDate !== undefined && {
        startDate: payload.startDate,
      }),

      ...(payload.endDate !== undefined && {
        endDate: payload.endDate,
      }),
    },

    include: {
      semesters: true,
    },
  });

  return updatedAcademicYear;
};

const deleteAcademicYear = async (
  id: string,
) => {
  const academicYear =
    await prisma.academicYear.findUnique({
      where: {
        id,
      },

      include: {
        semesters: true,
      },
    });

  if (!academicYear) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Academic year not found",
    );
  }

  if (academicYear.semesters.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete academic year because semesters exist under this academic year",
    );
  }

  await prisma.academicYear.delete({
    where: {
      id,
    },
  });

  return null;
};

export const AcademicYearService = {
  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
};
