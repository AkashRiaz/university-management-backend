import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateFacultyPayload,
  IUpdateFacultyPayload,
} from "./faculty.interface";
import { FacultyWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";

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

const getAllFaculties = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = ["name", "code", "createdAt", "updatedAt"];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: FacultyWhereInput[] = [];

  /*
   * Search
   */

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },

        {
          code: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },

        {
          description: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  /*
   * Get faculties
   */

  const faculties = await prisma.faculty.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      _count: {
        select: {
          departments: true,
        },
      },
    },
  });

  const total = await prisma.faculty.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: faculties,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getFacultyById = async (id: string) => {
  const faculty = await prisma.faculty.findUnique({
    where: {
      id,
    },
  });

  if (!faculty) {
    throw new AppError(httpStatus.NOT_FOUND, "Faculty not found.");
  }

  return faculty;
};

const updateFaculty = async (id: string, payload: IUpdateFacultyPayload) => {
  const existingFaculty = await prisma.faculty.findUnique({
    where: {
      id,
    },
  });

  if (!existingFaculty) {
    throw new AppError(httpStatus.NOT_FOUND, "Faculty not found.");
  }

  if (payload.code) {
    const existingCode = await prisma.faculty.findUnique({
      where: {
        code: payload.code,
      },
    });

    if (existingCode && existingCode.id !== id) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Faculty with code ${payload.code} already exists.`,
      );
    }
  }

  const faculty = await prisma.faculty.update({
    where: {
      id,
    },

    data: payload,
  });

  return faculty;
};

const deleteFaculty = async (id: string) => {
  const existingFaculty = await prisma.faculty.findUnique({
    where: {
      id,
    },
  });

  if (!existingFaculty) {
    throw new AppError(httpStatus.NOT_FOUND, "Faculty not found.");
  }


  const departmentCount = await prisma.department.count({
    where: {
      facultyId: id,
    },
  });

  if (departmentCount > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Cannot delete faculty because departments are associated with it.",
    );
  }

  const faculty = await prisma.faculty.delete({
    where: {
      id,
    },
  });

  return faculty;
};

export const facultyService = {
  createFaculty,
  getAllFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
};
