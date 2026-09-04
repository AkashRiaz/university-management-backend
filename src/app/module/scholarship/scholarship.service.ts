import {
  Prisma,
  ScholarshipStatus,
  ScholarshipType,
} from "../../../generated/prisma/client";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateScholarshipPayload,
  IUpdateScholarshipPayload,
} from "./scholarship.interface";
import httpStatus from "http-status";

const createScholarship = async (payload: ICreateScholarshipPayload) => {
  const scholarship = await prisma.scholarship.create({
    data: {
      name: payload.name,
      type: payload.type,

      percentage:
        payload.percentage !== undefined
          ? new Prisma.Decimal(payload.percentage)
          : null,

      fixedAmount:
        payload.fixedAmount !== undefined
          ? new Prisma.Decimal(payload.fixedAmount)
          : null,

      description: payload.description,

      status: payload.status ?? ScholarshipStatus.ACTIVE,
    },
  });

  return scholarship;
};

const getAllScholarships = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "name",
    "type",
    "status",
    "createdAt",
    "updatedAt",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: Prisma.ScholarshipWhereInput[] = [];

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

  if (query.type) {
    andConditions.push({
      type: query.type as ScholarshipType,
    });
  }

  if (query.status) {
    andConditions.push({
      status: query.status as ScholarshipStatus,
    });
  }

  const scholarships = await prisma.scholarship.findMany({
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
          students: true,
        },
      },
    },
  });

  const total = await prisma.scholarship.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: scholarships,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleScholarship = async (id: string) => {
  const scholarship = await prisma.scholarship.findUnique({
    where: {
      id,
    },

    include: {
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  if (!scholarship) {
    throw new AppError(httpStatus.NOT_FOUND, "Scholarship not found");
  }

  return scholarship;
};

const updateScholarship = async (
  id: string,
  payload: IUpdateScholarshipPayload,
) => {
  const existingScholarship = await prisma.scholarship.findUnique({
    where: {
      id,
    },
  });

  if (!existingScholarship) {
    throw new AppError(httpStatus.NOT_FOUND, "Scholarship not found");
  }

  const data: Prisma.ScholarshipUpdateInput = {};

  if (payload.name !== undefined) {
    data.name = payload.name;
  }

  if (payload.type !== undefined) {
    data.type = payload.type;
  }

  if (payload.description !== undefined) {
    data.description = payload.description;
  }

  if (payload.status !== undefined) {
    data.status = payload.status;
  }

  /*
   * Percentage scholarship
   */
  if (payload.percentage !== undefined) {
    data.percentage =
      payload.percentage === null
        ? null
        : new Prisma.Decimal(payload.percentage);

    /*
     * If percentage is selected,
     * remove fixed amount.
     */
    data.fixedAmount = null;
  }

  /*
   * Fixed amount scholarship
   */
  if (payload.fixedAmount !== undefined) {
    data.fixedAmount =
      payload.fixedAmount === null
        ? null
        : new Prisma.Decimal(payload.fixedAmount);

    /*
     * If fixed amount is selected,
     * remove percentage.
     */
    data.percentage = null;
  }

  const scholarship = await prisma.scholarship.update({
    where: {
      id,
    },

    data,
  });

  return scholarship;
};

const deleteScholarship = async (id: string) => {
  const scholarship = await prisma.scholarship.findUnique({
    where: {
      id,
    },

    include: {
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  if (!scholarship) {
    throw new AppError(httpStatus.NOT_FOUND, "Scholarship not found");
  }

  if (scholarship._count.students > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete scholarship because it is assigned to students",
    );
  }

  await prisma.scholarship.delete({
    where: {
      id,
    },
  });

  return null;
};

export const ScholarshipService = {
  createScholarship,
  getAllScholarships,
  getSingleScholarship,
  updateScholarship,
  deleteScholarship,
};
