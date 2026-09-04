import { FeeStructureWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateFeeStructurePayload,
  IUpdateFeeStructurePayload,
} from "./feeStructure.interface";
import httpStatus from "http-status";

const feeStructureInclude = {
  program: true,

  semester: {
    include: {
      academicYear: true,
    },
  },

  items: true,
};

const createFeeStructure = async (payload: ICreateFeeStructurePayload) => {
  if (payload.programId) {
    const program = await prisma.program.findUnique({
      where: {
        id: payload.programId,
      },
    });

    if (!program) {
      throw new AppError(httpStatus.NOT_FOUND, "Program not found");
    }
  }

  if (payload.semesterId) {
    const semester = await prisma.semester.findUnique({
      where: {
        id: payload.semesterId,
      },
    });

    if (!semester) {
      throw new AppError(httpStatus.NOT_FOUND, "Semester not found");
    }
  }

  const feeStructure = await prisma.feeStructure.create({
    data: {
      name: payload.name,

      description: payload.description,

      programId: payload.programId,

      semesterId: payload.semesterId,
    },

    include: feeStructureInclude,
  });

  return feeStructure;
};

const getAllFeeStructures = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = ["name", "createdAt", "updatedAt"];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: FeeStructureWhereInput[] = [];

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
          description: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (query.programId) {
    andConditions.push({
      programId: query.programId,
    });
  }

  if (query.semesterId) {
    andConditions.push({
      semesterId: query.semesterId,
    });
  }

  const feeStructures = await prisma.feeStructure.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: feeStructureInclude,
  });

  const total = await prisma.feeStructure.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: feeStructures,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getFeeStructureById = async (id: string) => {
  const feeStructure = await prisma.feeStructure.findUnique({
    where: {
      id,
    },

    include: feeStructureInclude,
  });

  if (!feeStructure) {
    throw new AppError(httpStatus.NOT_FOUND, "Fee structure not found");
  }

  return feeStructure;
};

const getFeeStructuresByProgram = async (programId: string, query: IQuery) => {
  const program = await prisma.program.findUnique({
    where: {
      id: programId,
    },
  });

  if (!program) {
    throw new AppError(httpStatus.NOT_FOUND, "Program not found");
  }

  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const andConditions: FeeStructureWhereInput[] = [
    {
      programId,
    },
  ];

  const feeStructures = await prisma.feeStructure.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      createdAt: "desc",
    },

    include: feeStructureInclude,
  });

  const total = await prisma.feeStructure.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: feeStructures,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getFeeStructuresBySemester = async (
  semesterId: string,
  query: IQuery,
) => {
  const semester = await prisma.semester.findUnique({
    where: {
      id: semesterId,
    },
  });

  if (!semester) {
    throw new AppError(httpStatus.NOT_FOUND, "Semester not found");
  }

  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const andConditions: FeeStructureWhereInput[] = [
    {
      semesterId,
    },
  ];

  const feeStructures = await prisma.feeStructure.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      createdAt: "desc",
    },

    include: feeStructureInclude,
  });

  const total = await prisma.feeStructure.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: feeStructures,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateFeeStructure = async (
  id: string,
  payload: IUpdateFeeStructurePayload,
) => {
  const existingFeeStructure = await prisma.feeStructure.findUnique({
    where: {
      id,
    },
  });

  if (!existingFeeStructure) {
    throw new AppError(httpStatus.NOT_FOUND, "Fee structure not found");
  }

  if (payload.programId) {
    const program = await prisma.program.findUnique({
      where: {
        id: payload.programId,
      },
    });

    if (!program) {
      throw new AppError(httpStatus.NOT_FOUND, "Program not found");
    }
  }

  if (payload.semesterId) {
    const semester = await prisma.semester.findUnique({
      where: {
        id: payload.semesterId,
      },
    });

    if (!semester) {
      throw new AppError(httpStatus.NOT_FOUND, "Semester not found");
    }
  }

  const feeStructure = await prisma.feeStructure.update({
    where: {
      id,
    },

    data: {
      ...(payload.name !== undefined && {
        name: payload.name,
      }),
      ...(payload.description !== undefined && {
        description: payload.description,
      }),
      ...(payload.programId !== undefined && {
        programId: payload.programId,
      }),
      ...(payload.semesterId !== undefined && {
        semesterId: payload.semesterId,
      }),
    },

    include: feeStructureInclude,
  });

  return feeStructure;
};

const deleteFeeStructure = async (id: string) => {
  const feeStructure = await prisma.feeStructure.findUnique({
    where: {
      id,
    },
  });

  if (!feeStructure) {
    throw new AppError(httpStatus.NOT_FOUND, "Fee structure not found");
  }

  await prisma.feeStructure.delete({
    where: {
      id,
    },
  });

  return null;
};

export const FeeStructureService = {
  createFeeStructure,
  getAllFeeStructures,
  getFeeStructureById,
  getFeeStructuresByProgram,
  getFeeStructuresBySemester,
  updateFeeStructure,
  deleteFeeStructure,
};
