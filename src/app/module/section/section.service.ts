import { SectionWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateSectionPayload,
  IUpdateSectionPayload,
} from "./section.interface";
import httpStatus from "http-status";

const createSection = async (payload: ICreateSectionPayload) => {
  /*
   * Check course
   */
  const course = await prisma.course.findUnique({
    where: {
      id: payload.courseId,
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  /*
   * Check semester
   */
  const semester = await prisma.semester.findUnique({
    where: {
      id: payload.semesterId,
    },
  });

  if (!semester) {
    throw new AppError(httpStatus.NOT_FOUND, "Semester not found");
  }

  /*
   * Check department
   */
  const department = await prisma.department.findUnique({
    where: {
      id: payload.departmentId,
    },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  /*
   * Course and section department
   * must be the same.
   */
  if (course.departmentId !== payload.departmentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Course does not belong to the specified department",
    );
  }

  /*
   * Check room if provided.
   */
  if (payload.roomId) {
    const room = await prisma.room.findUnique({
      where: {
        id: payload.roomId,
      },
    });

    if (!room) {
      throw new AppError(httpStatus.NOT_FOUND, "Room not found");
    }

    /*
     * Section capacity cannot exceed
     * room capacity.
     */
    if (payload.capacity > room.capacity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Section capacity cannot exceed room capacity of ${room.capacity}`,
      );
    }
  }

  /*
   * Check duplicate section.
   *
   * Same course + semester + section name
   * is not allowed.
   */
  const existingSection = await prisma.section.findUnique({
    where: {
      courseId_semesterId_name: {
        courseId: payload.courseId,

        semesterId: payload.semesterId,

        name: payload.name,
      },
    },
  });

  if (existingSection) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This section already exists for the course and semester",
    );
  }

  /*
   * Create section.
   *
   * enrolledCount automatically
   * starts from 0.
   */
  const section = await prisma.section.create({
    data: {
      name: payload.name,
      capacity: payload.capacity,
      status: payload.status,

      courseId: payload.courseId,

      semesterId: payload.semesterId,

      departmentId: payload.departmentId,

      roomId: payload.roomId,
    },

    include: {
      course: true,

      semester: {
        include: {
          academicYear: true,
        },
      },

      department: true,

      room: true,
    },
  });

  return section;
};

const getAllSections = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "name",
    "capacity",
    "enrolledCount",
    "status",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

  const andConditions: SectionWhereInput[] = [];

  /*
   * Filters
   */

  if (query.courseId) {
    andConditions.push({
      courseId: query.courseId,
    });
  }

  if (query.semesterId) {
    andConditions.push({
      semesterId: query.semesterId,
    });
  }

  if (query.departmentId) {
    andConditions.push({
      departmentId: query.departmentId,
    });
  }

  if (query.roomId) {
    andConditions.push({
      roomId: query.roomId,
    });
  }

  if (query.status) {
    andConditions.push({
      status: query.status,
    });
  }

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
          course: {
            code: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          course: {
            title: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          department: {
            code: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          department: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          room: {
            building: {
              contains: query.searchTerm,
              mode: "insensitive",
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

  const sections = await prisma.section.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      course: true,

      semester: {
        include: {
          academicYear: true,
        },
      },

      department: true,

      room: true,
    },
  });

  const total = await prisma.section.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: sections,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSectionById = async (id: string) => {
  const section = await prisma.section.findUnique({
    where: {
      id,
    },

    include: {
      course: true,

      semester: {
        include: {
          academicYear: true,
        },
      },

      department: true,

      room: true,

      instructors: {
        include: {
          instructor: {
            include: {
              user: {
                omit: {
                  password: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!section) {
    throw new AppError(httpStatus.NOT_FOUND, "Section not found");
  }

  return section;
};

const getSectionsBySemester = async (semesterId: string, query: IQuery) => {
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

  const andConditions: SectionWhereInput[] = [
    {
      semesterId,
    },
  ];

  const sections = await prisma.section.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: [
      {
        department: {
          code: "asc",
        },
      },
      {
        course: {
          code: "asc",
        },
      },
      {
        name: "asc",
      },
    ],

    include: {
      course: true,

      department: true,

      room: true,
    },
  });

  const total = await prisma.section.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: sections,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSectionsByCourse = async (courseId: string, query: IQuery) => {
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const andConditions: SectionWhereInput[] = [
    {
      courseId,
    },
  ];

  const sections = await prisma.section.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      createdAt: "desc",
    },

    include: {
      course: true,

      semester: {
        include: {
          academicYear: true,
        },
      },

      department: true,

      room: true,
    },
  });

  const total = await prisma.section.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: sections,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateSection = async (id: string, payload: IUpdateSectionPayload) => {
  /*
   * Find existing section
   */
  const existingSection = await prisma.section.findUnique({
    where: {
      id,
    },
  });

  if (!existingSection) {
    throw new AppError(httpStatus.NOT_FOUND, "Section not found");
  }

  /*
   * Final values
   */
  const courseId = payload.courseId ?? existingSection.courseId;

  const semesterId = payload.semesterId ?? existingSection.semesterId;

  const departmentId = payload.departmentId ?? existingSection.departmentId;

  const capacity = payload.capacity ?? existingSection.capacity;

  const roomId =
    payload.roomId !== undefined ? payload.roomId : existingSection.roomId;

  /*
   * Course
   */
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  /*
   * Semester
   */
  const semester = await prisma.semester.findUnique({
    where: {
      id: semesterId,
    },
  });

  if (!semester) {
    throw new AppError(httpStatus.NOT_FOUND, "Semester not found");
  }

  /*
   * Department
   */
  const department = await prisma.department.findUnique({
    where: {
      id: departmentId,
    },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  /*
   * Course must belong to department
   */
  if (course.departmentId !== departmentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Course does not belong to the specified department",
    );
  }

  /*
   * Capacity cannot be smaller
   * than already enrolled students.
   */
  if (capacity < existingSection.enrolledCount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Section capacity cannot be less than current enrolled count of ${existingSection.enrolledCount}`,
    );
  }

  /*
   * Room validation
   */
  if (roomId) {
    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room) {
      throw new AppError(httpStatus.NOT_FOUND, "Room not found");
    }

    if (capacity > room.capacity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Section capacity cannot exceed room capacity of ${room.capacity}`,
      );
    }
  }

  /*
   * Duplicate section check
   */
  if (
    payload.name !== undefined ||
    payload.courseId !== undefined ||
    payload.semesterId !== undefined
  ) {
    const duplicateSection = await prisma.section.findFirst({
      where: {
        id: {
          not: id,
        },

        courseId,

        semesterId,

        name: payload.name ?? existingSection.name,
      },
    });

    if (duplicateSection) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This section already exists for the course and semester",
      );
    }
  }

  /*
   * Update
   */
  const section = await prisma.section.update({
    where: {
      id,
    },

    data: {
      ...(payload.name !== undefined && {
        name: payload.name,
      }),

      ...(payload.capacity !== undefined && {
        capacity: payload.capacity,
      }),

      ...(payload.status !== undefined && {
        status: payload.status,
      }),

      ...(payload.courseId !== undefined && {
        courseId: payload.courseId,
      }),

      ...(payload.semesterId !== undefined && {
        semesterId: payload.semesterId,
      }),

      ...(payload.departmentId !== undefined && {
        departmentId: payload.departmentId,
      }),

      ...(payload.roomId !== undefined && {
        roomId: payload.roomId,
      }),
    },

    include: {
      course: true,

      semester: {
        include: {
          academicYear: true,
        },
      },

      department: true,

      room: true,
    },
  });

  return section;
};

const deleteSection = async (id: string) => {
  const section = await prisma.section.findUnique({
    where: {
      id,
    },

    include: {
      _count: {
        select: {
          registrations: true,
          attendanceSessions: true,
          exams: true,
        },
      },
    },
  });

  if (!section) {
    throw new AppError(httpStatus.NOT_FOUND, "Section not found");
  }

  /*
   * Students already registered
   */
  if (section._count.registrations > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete section because students are registered in this section",
    );
  }

  /*
   * Attendance already exists
   */
  if (section._count.attendanceSessions > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete section because attendance sessions exist",
    );
  }

  /*
   * Exams already exist
   */
  if (section._count.exams > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete section because exams exist",
    );
  }

  await prisma.section.delete({
    where: {
      id,
    },
  });

  return null;
};

export const SectionService = {
  createSection,
  getAllSections,
  getSectionById,
  getSectionsBySemester,
  getSectionsByCourse,
  updateSection,
  deleteSection,
};
