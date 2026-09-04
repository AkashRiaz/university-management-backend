import { RoomWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateRoomPayload, IUpdateRoomPayload } from "./room.interface";
import httpStatus from "http-status";

const createRoom = async (payload: ICreateRoomPayload) => {
  const existingRoom = await prisma.room.findUnique({
    where: {
      building_roomNumber: {
        building: payload.building,
        roomNumber: payload.roomNumber,
      },
    },
  });

  if (existingRoom) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This room already exists in the building",
    );
  }

  const room = await prisma.room.create({
    data: {
      building: payload.building,
      roomNumber: payload.roomNumber,
      capacity: payload.capacity,
    },
  });

  return room;
};

const getAllRooms = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "building",
    "roomNumber",
    "capacity",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

  const andConditions: RoomWhereInput[] = [];

  // Building filter
  if (query.building) {
    andConditions.push({
      building: {
        equals: query.building,
        mode: "insensitive",
      },
    });
  }

  // Search
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          building: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          roomNumber: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  const rooms = await prisma.room.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.room.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: rooms,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getRoomById = async (id: string) => {
  const room = await prisma.room.findUnique({
    where: {
      id,
    },

    include: {
      _count: {
        select: {
          sections: true,
          schedules: true,
        },
      },
    },
  });

  if (!room) {
    throw new AppError(httpStatus.NOT_FOUND, "Room not found");
  }

  return room;
};

const updateRoom = async (id: string, payload: IUpdateRoomPayload) => {
  const existingRoom = await prisma.room.findUnique({
    where: {
      id,
    },
  });

  if (!existingRoom) {
    throw new AppError(httpStatus.NOT_FOUND, "Room not found");
  }

  const building = payload.building ?? existingRoom.building;

  const roomNumber = payload.roomNumber ?? existingRoom.roomNumber;

  const capacity = payload.capacity ?? existingRoom.capacity;

  /*
   * Check whether another room
   * already has the same
   * building + room number.
   */
  if (payload.building !== undefined || payload.roomNumber !== undefined) {
    const duplicateRoom = await prisma.room.findFirst({
      where: {
        id: {
          not: id,
        },

        building: {
          equals: building,
          mode: "insensitive",
        },

        roomNumber: {
          equals: roomNumber,
          mode: "insensitive",
        },
      },
    });

    if (duplicateRoom) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Another room with this building and room number already exists",
      );
    }
  }

  /*
   * Do not allow room capacity
   * to become smaller than an
   * existing section capacity.
   */
  if (payload.capacity !== undefined) {
    const section = await prisma.section.findFirst({
      where: {
        roomId: id,
        capacity: {
          gt: capacity,
        },
      },
    });

    if (section) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Room capacity cannot be less than section capacity of ${section.capacity}`,
      );
    }
  }

  const room = await prisma.room.update({
    where: {
      id,
    },

    data: {
      ...(payload.building !== undefined && {
        building: payload.building,
      }),

      ...(payload.roomNumber !== undefined && {
        roomNumber: payload.roomNumber,
      }),

      ...(payload.capacity !== undefined && {
        capacity: payload.capacity,
      }),
    },
  });

  return room;
};

const deleteRoom = async (id: string) => {
  const room = await prisma.room.findUnique({
    where: {
      id,
    },

    include: {
      _count: {
        select: {
          sections: true,
          schedules: true,
        },
      },
    },
  });

  if (!room) {
    throw new AppError(httpStatus.NOT_FOUND, "Room not found");
  }

  if (room._count.sections > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete room because it is assigned to one or more sections",
    );
  }

  if (room._count.schedules > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete room because it is used in one or more class schedules",
    );
  }

  await prisma.room.delete({
    where: {
      id,
    },
  });

  return null;
};

export const RoomService = {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
};
