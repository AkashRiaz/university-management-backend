import { AnnouncementWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateAnnouncementPayload,
  IUpdateAnnouncementPayload,
} from "./announcement.interface";
import httpStatus from "http-status";

const createAnnouncement = async (payload: ICreateAnnouncementPayload) => {
  let publishedAt = payload.publishedAt;

  if (payload.isPublished === true && !publishedAt) {
    publishedAt = new Date();
  }

  if (payload.isPublished !== true) {
    publishedAt = undefined;
  }

  if (publishedAt && payload.expiresAt && payload.expiresAt <= publishedAt) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Expiration date must be after published date",
    );
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: payload.title,
      content: payload.content,
      isPublished: payload.isPublished ?? false,
      publishedAt,
      expiresAt: payload.expiresAt,
    },
  });

  return announcement;
};

const getAllAnnouncements = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "title",
    "publishedAt",
    "expiresAt",
    "createdAt",
    "updatedAt",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: AnnouncementWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (query.isPublished !== undefined) {
    andConditions.push({
      isPublished: query.isPublished === true || query.isPublished === "true",
    });
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.announcement.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: announcements,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAnnouncementById = async (id: string) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    throw new AppError(httpStatus.NOT_FOUND, "Announcement not found");
  }

  return announcement;
};

const getPublishedAnnouncements = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const now = new Date();

  const andConditions: AnnouncementWhereInput[] = [
    {
      isPublished: true,
    },

    {
      OR: [
        {
          publishedAt: null,
        },
        {
          publishedAt: {
            lte: now,
          },
        },
      ],
    },

    {
      OR: [
        {
          expiresAt: null,
        },
        {
          expiresAt: {
            gt: now,
          },
        },
      ],
    },
  ];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      publishedAt: "desc",
    },
  });

  const total = await prisma.announcement.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: announcements,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateAnnouncement = async (
  id: string,
  payload: IUpdateAnnouncementPayload,
) => {
  const existingAnnouncement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!existingAnnouncement) {
    throw new AppError(httpStatus.NOT_FOUND, "Announcement not found");
  }

  let isPublished = payload.isPublished ?? existingAnnouncement.isPublished;

  let publishedAt =
    payload.publishedAt !== undefined
      ? payload.publishedAt
      : existingAnnouncement.publishedAt;

  const expiresAt =
    payload.expiresAt !== undefined
      ? payload.expiresAt
      : existingAnnouncement.expiresAt;

  /*
   * Publishing an announcement
   */
  if (
    payload.isPublished === true &&
    !existingAnnouncement.isPublished &&
    payload.publishedAt === undefined
  ) {
    publishedAt = new Date();
  }

  /*
   * If unpublished, remove publishedAt
   */
  if (isPublished === false) {
    publishedAt = null;
  }

  /*
   * If publishing but publishedAt is still null
   */
  if (isPublished === true && !publishedAt) {
    publishedAt = new Date();
  }

  if (publishedAt && expiresAt && expiresAt <= publishedAt) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Expiration date must be after published date",
    );
  }

  const announcement = await prisma.announcement.update({
    where: { id },

    data: {
      ...(payload.title !== undefined && {
        title: payload.title,
      }),

      ...(payload.content !== undefined && {
        content: payload.content,
      }),

      isPublished,

      publishedAt,

      expiresAt,
    },
  });

  return announcement;
};

const deleteAnnouncement = async (id: string) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    throw new AppError(httpStatus.NOT_FOUND, "Announcement not found");
  }

  await prisma.announcement.delete({
    where: { id },
  });

  return null;
};

export const AnnouncementService = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  getPublishedAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
};
