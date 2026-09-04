import { Prisma } from "../../../generated/prisma/client";
import { ClassScheduleWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateClassSchedulePayload,
  IUpdateClassSchedulePayload,
} from "./classSchedule.interface";
import httpStatus from "http-status";

const getScheduleInclude = {
  section: {
    include: {
      course: true,
      semester: true,
    },
  },

  room: true,

  department: true,
};

const createClassSchedule = async (payload: ICreateClassSchedulePayload) => {
  // Check section
  const section = await prisma.section.findUnique({
    where: {
      id: payload.sectionId,
    },

    include: {
      course: true,
      semester: true,
    },
  });

  if (!section) {
    throw new AppError(httpStatus.NOT_FOUND, "Section not found");
  }

  // Check department
  const department = await prisma.department.findUnique({
    where: {
      id: payload.departmentId,
    },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  // Check section department
  if (section.departmentId !== payload.departmentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Section does not belong to the specified department",
    );
  }

  // Check room
  if (payload.roomId) {
    const room = await prisma.room.findUnique({
      where: {
        id: payload.roomId,
      },
    });

    if (!room) {
      throw new AppError(httpStatus.NOT_FOUND, "Room not found");
    }

    // Check room capacity
    if (room.capacity < section.capacity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Room capacity is less than section capacity",
      );
    }
  }

  // Check section schedule conflict
  const sectionConflict = await prisma.classSchedule.findFirst({
    where: {
      sectionId: payload.sectionId,

      dayOfWeek: payload.dayOfWeek,

      startTime: {
        lt: payload.endTime,
      },

      endTime: {
        gt: payload.startTime,
      },
    },
  });

  if (sectionConflict) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This section already has a schedule during this time",
    );
  }

  // Check room schedule conflict
  if (payload.roomId) {
    const roomConflict = await prisma.classSchedule.findFirst({
      where: {
        roomId: payload.roomId,

        dayOfWeek: payload.dayOfWeek,

        startTime: {
          lt: payload.endTime,
        },

        endTime: {
          gt: payload.startTime,
        },
      },
    });

    if (roomConflict) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This room is already scheduled during this time",
      );
    }
  }

  const classSchedule = await prisma.classSchedule.create({
    data: {
      dayOfWeek: payload.dayOfWeek,

      startTime: payload.startTime,

      endTime: payload.endTime,

      sectionId: payload.sectionId,

      roomId: payload.roomId,

      departmentId: payload.departmentId,
    },

    include: getScheduleInclude,
  });

  return classSchedule;
};

const getAllClassSchedules = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = ["dayOfWeek", "startTime", "endTime"];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "dayOfWeek";

  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

  const andConditions: ClassScheduleWhereInput[] = [];

  /*
   * Filters
   */

  // Department filter
  if (query.departmentId) {
    andConditions.push({
      departmentId: query.departmentId,
    });
  }

  // Section filter
  if (query.sectionId) {
    andConditions.push({
      sectionId: query.sectionId,
    });
  }

  // Room filter
  if (query.roomId) {
    andConditions.push({
      roomId: query.roomId,
    });
  }

  // Day filter
  if (query.dayOfWeek) {
    andConditions.push({
      dayOfWeek: Number(query.dayOfWeek),
    });
  }

  /*
   * Search
   */

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          startTime: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          endTime: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          section: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          section: {
            course: {
              code: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
        {
          section: {
            course: {
              title: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
        {
          room: {
            roomNumber: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  const schedules = await prisma.classSchedule.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: getScheduleInclude,
  });

  const total = await prisma.classSchedule.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: schedules,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getClassScheduleById = async (id: string) => {
  const classSchedule = await prisma.classSchedule.findUnique({
    where: {
      id,
    },

    include: getScheduleInclude,
  });

  if (!classSchedule) {
    throw new AppError(httpStatus.NOT_FOUND, "Class schedule not found");
  }

  return classSchedule;
};

const getClassSchedulesBySection = async (sectionId: string, query: IQuery) => {
  const section = await prisma.section.findUnique({
    where: {
      id: sectionId,
    },
    include: {
      course: true,
    },
  });

  if (!section) {
    throw new AppError(httpStatus.NOT_FOUND, "Section not found");
  }

  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const andConditions: ClassScheduleWhereInput[] = [
    {
      sectionId,
    },
  ];

  const schedules = await prisma.classSchedule.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: [
      {
        dayOfWeek: "asc",
      },
      {
        startTime: "asc",
      },
    ],

    include: getScheduleInclude,
  });

  const total = await prisma.classSchedule.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: schedules,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getClassSchedulesByDepartment = async (
  departmentId: string,
  query: IQuery,
) => {
  const department = await prisma.department.findUnique({
    where: {
      id: departmentId,
    },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const andConditions: ClassScheduleWhereInput[] = [
    {
      departmentId,
    },
  ];

  const schedules = await prisma.classSchedule.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: [
      {
        dayOfWeek: "asc",
      },
      {
        startTime: "asc",
      },
    ],

    include: getScheduleInclude,
  });

  const total = await prisma.classSchedule.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: schedules,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateClassSchedule = async (
  id: string,
  payload: IUpdateClassSchedulePayload,
) => {
  const existingSchedule = await prisma.classSchedule.findUnique({
    where: {
      id,
    },
  });

  if (!existingSchedule) {
    throw new AppError(httpStatus.NOT_FOUND, "Class schedule not found");
  }

  // Final values after update
  const dayOfWeek = payload.dayOfWeek ?? existingSchedule.dayOfWeek;

  const startTime = payload.startTime ?? existingSchedule.startTime;

  const endTime = payload.endTime ?? existingSchedule.endTime;

  const sectionId = payload.sectionId ?? existingSchedule.sectionId;

  const departmentId = payload.departmentId ?? existingSchedule.departmentId;

  const roomId =
    payload.roomId !== undefined ? payload.roomId : existingSchedule.roomId;

  // Time validation
  if (startTime >= endTime) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "End time must be after start time",
    );
  }

  // Check section
  const section = await prisma.section.findUnique({
    where: {
      id: sectionId,
    },
  });

  if (!section) {
    throw new AppError(httpStatus.NOT_FOUND, "Section not found");
  }

  // Check department
  const department = await prisma.department.findUnique({
    where: {
      id: departmentId,
    },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  // Section must belong to department
  if (section.departmentId !== departmentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Section does not belong to the specified department",
    );
  }

  // Check room
  if (roomId) {
    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room) {
      throw new AppError(httpStatus.NOT_FOUND, "Room not found");
    }

    // Check capacity
    if (room.capacity < section.capacity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Room capacity is less than section capacity",
      );
    }
  }

  // Check section conflict
  const sectionConflict = await prisma.classSchedule.findFirst({
    where: {
      id: {
        not: id,
      },

      sectionId,

      dayOfWeek,

      startTime: {
        lt: endTime,
      },

      endTime: {
        gt: startTime,
      },
    },
  });

  if (sectionConflict) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This section already has a schedule during this time",
    );
  }

  // Check room conflict
  if (roomId) {
    const roomConflict = await prisma.classSchedule.findFirst({
      where: {
        id: {
          not: id,
        },

        roomId,

        dayOfWeek,

        startTime: {
          lt: endTime,
        },

        endTime: {
          gt: startTime,
        },
      },
    });

    if (roomConflict) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This room is already scheduled during this time",
      );
    }
  }

  const classSchedule = await prisma.classSchedule.update({
    where: {
      id,
    },

    data: {
      ...(payload.dayOfWeek !== undefined && {
        dayOfWeek: payload.dayOfWeek,
      }),

      ...(payload.startTime !== undefined && {
        startTime: payload.startTime,
      }),

      ...(payload.endTime !== undefined && {
        endTime: payload.endTime,
      }),

      ...(payload.sectionId !== undefined && {
        sectionId: payload.sectionId,
      }),

      ...(payload.roomId !== undefined && {
        roomId: payload.roomId,
      }),

      ...(payload.departmentId !== undefined && {
        departmentId: payload.departmentId,
      }),
    },

    include: getScheduleInclude,
  });

  return classSchedule;
};

const deleteClassSchedule = async (id: string) => {
  const classSchedule = await prisma.classSchedule.findUnique({
    where: {
      id,
    },
  });

  if (!classSchedule) {
    throw new AppError(httpStatus.NOT_FOUND, "Class schedule not found");
  }

  await prisma.classSchedule.delete({
    where: {
      id,
    },
  });

  return null;
};


export const ClassScheduleService = {
  createClassSchedule,
  getAllClassSchedules,
  getClassScheduleById,
  getClassSchedulesBySection,
  getClassSchedulesByDepartment,
  updateClassSchedule,
  deleteClassSchedule,
};