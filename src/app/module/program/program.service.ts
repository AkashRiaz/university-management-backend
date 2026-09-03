import { IQuery } from "../../interfaces";
import { Program } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateProgramPayload,
  IUpdateProgramPayload,
} from "./program.interface";
import httpStatus from "http-status";
import { ProgramWhereInput } from "../../../generated/prisma/models";

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

const getAllPrograms = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;
  const page = query.page ? parseInt(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

  const andConditions: ProgramWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: query.searchTerm, mode: "insensitive" } },
        { code: { contains: query.searchTerm, mode: "insensitive" } },
        { description: { contains: query.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (query.departmentId) {
    andConditions.push({
      departmentId: query.departmentId,
    });
  }

  const programs = await prisma.program.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      department: true,
    },
  });

  const total = await prisma.program.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: programs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getProgramsByDepartment = async (departmentId: string, query: IQuery) => {
  const department = await prisma.department.findUnique({
    where: {
      id: departmentId,
    },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

  const andConditions: ProgramWhereInput[] = [
    {
      departmentId,
    },
  ];

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
      ],
    });
  }

  const programs = await prisma.program.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      department: true,
    },
  });

  const total = await prisma.program.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: programs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getProgramById = async (id: string): Promise<Program> => {
  const program = await prisma.program.findUnique({
    where: {
      id,
    },
    include: {
      department: {
        include: {
          faculty: true,
        },
      },
    },
  });

  if (!program) {
    throw new AppError(httpStatus.NOT_FOUND, "Program not found");
  }

  return program;
};

const updateProgram = async (
  id: string,
  payload: IUpdateProgramPayload,
): Promise<Program> => {
  const existingProgram = await prisma.program.findUnique({
    where: {
      id,
    },
  });

  if (!existingProgram) {
    throw new AppError(httpStatus.NOT_FOUND, "Program not found");
  }

  // If departmentId is being changed,
  // make sure the new department exists.
  if (payload.departmentId) {
    const department = await prisma.department.findUnique({
      where: {
        id: payload.departmentId,
      },
    });

    if (!department) {
      throw new AppError(httpStatus.NOT_FOUND, "Department not found");
    }
  }

  const departmentId = payload.departmentId || existingProgram.departmentId;

  const code = payload.code || existingProgram.code;

  // Check unique constraint:
  // @@unique([departmentId, code])
  const duplicateProgram = await prisma.program.findFirst({
    where: {
      departmentId,
      code,
      NOT: {
        id,
      },
    },
  });

  if (duplicateProgram) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Program with this code already exists in this department",
    );
  }

  const updatedProgram = await prisma.program.update({
    where: {
      id,
    },
    data: {
      ...(payload.name !== undefined && {
        name: payload.name,
      }),

      ...(payload.code !== undefined && {
        code: payload.code,
      }),

      ...(payload.description !== undefined && {
        description: payload.description,
      }),

      ...(payload.durationYears !== undefined && {
        durationYears: payload.durationYears,
      }),

      ...(payload.totalCredits !== undefined && {
        totalCredits: payload.totalCredits,
      }),

      ...(payload.departmentId !== undefined && {
        departmentId: payload.departmentId,
      }),
    },

    include: {
      department: true,
    },
  });

  return updatedProgram;
};

const deleteProgram = async (id: string): Promise<Program> => {
  const existingProgram = await prisma.program.findUnique({
    where: {
      id,
    },
  });

  if (!existingProgram) {
    throw new AppError(httpStatus.NOT_FOUND, "Program not found");
  }

  const deletedProgram = await prisma.program.delete({
    where: {
      id,
    },
  });

  return deletedProgram;
};

export const ProgramService = {
  createProgram,
  getAllPrograms,
  getProgramsByDepartment,
  getProgramById,
  updateProgram,
  deleteProgram,
};
