import { Prisma } from "../../../generated/prisma/client";
import { FeeStructureItemWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateFeeStructureItemPayload,
  IUpdateFeeStructureItemPayload,
} from "./feeStructureItem.interface";
import httpStatus from "http-status";

const createFeeStructureItem = async (
  payload: ICreateFeeStructureItemPayload,
) => {
  const feeStructure = await prisma.feeStructure.findUnique({
    where: {
      id: payload.feeStructureId,
    },
  });

  if (!feeStructure) {
    throw new AppError(httpStatus.NOT_FOUND, "Fee structure not found");
  }

  const item = await prisma.feeStructureItem.create({
    data: {
      feeStructureId: payload.feeStructureId,

      name: payload.name,

      description: payload.description,

      amount: new Prisma.Decimal(payload.amount),
    },

    include: {
      feeStructure: true,
    },
  });

  return item;
};

const getAllFeeStructureItems = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = ["id", "feeStructureId", "name", "amount"];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "name";

  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

  const andConditions: FeeStructureItemWhereInput[] = [];

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

  if (query.feeStructureId) {
    andConditions.push({
      feeStructureId: query.feeStructureId,
    });
  }

  const items = await prisma.feeStructureItem.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      feeStructure: true,
    },
  });

  const total = await prisma.feeStructureItem.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: items,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getFeeStructureItemById = async (id: string) => {
  const item = await prisma.feeStructureItem.findUnique({
    where: {
      id,
    },
    include: {
      feeStructure: true,
    },
  });

  if (!item) {
    throw new AppError(httpStatus.NOT_FOUND, "Fee structure item not found");
  }

  return item;
};

const getItemsByFeeStructure = async (
  feeStructureId: string,
  query: IQuery,
) => {
  const feeStructure = await prisma.feeStructure.findUnique({
    where: {
      id: feeStructureId,
    },
  });

  if (!feeStructure) {
    throw new AppError(httpStatus.NOT_FOUND, "Fee structure not found");
  }

  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = ["id", "feeStructureId", "name", "amount"];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "name";

  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

  const andConditions: FeeStructureItemWhereInput[] = [
    {
      feeStructureId,
    },
  ];

  const items = await prisma.feeStructureItem.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      feeStructure: true,
    },
  });

  const total = await prisma.feeStructureItem.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: items,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateFeeStructureItem = async (
  id: string,
  payload: IUpdateFeeStructureItemPayload,
) => {
  const existingItem = await prisma.feeStructureItem.findUnique({
    where: {
      id,
    },
  });

  if (!existingItem) {
    throw new AppError(httpStatus.NOT_FOUND, "Fee structure item not found");
  }

  const item = await prisma.feeStructureItem.update({
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

      ...(payload.amount !== undefined && {
        amount: new Prisma.Decimal(payload.amount),
      }),
    },

    include: {
      feeStructure: true,
    },
  });

  return item;
};

const deleteFeeStructureItem = async (id: string) => {
  const existingItem = await prisma.feeStructureItem.findUnique({
    where: {
      id,
    },
  });

  if (!existingItem) {
    throw new AppError(httpStatus.NOT_FOUND, "Fee structure item not found");
  }

  await prisma.feeStructureItem.delete({
    where: {
      id,
    },
  });

  return null;
};

export const FeeStructureItemService = {
  createFeeStructureItem,
  getAllFeeStructureItems,
  getFeeStructureItemById,
  getItemsByFeeStructure,
  updateFeeStructureItem,
  deleteFeeStructureItem,
};
