import { CoursePrerequisiteWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateCoursePrerequisitePayload,
  IUpdateCoursePrerequisitePayload,
} from "./coursePrerequisite.interface";
import httpStatus from "http-status";

const hasPrerequisitePath = async (
  startCourseId: string,
  targetCourseId: string,
  visited = new Set<string>(),
): Promise<boolean> => {
  if (startCourseId === targetCourseId) {
    return true;
  }

  if (visited.has(startCourseId)) {
    return false;
  }

  visited.add(startCourseId);

  const prerequisites = await prisma.coursePrerequisite.findMany({
    where: {
      courseId: startCourseId,
    },

    select: {
      prerequisiteCourseId: true,
    },
  });

  for (const prerequisite of prerequisites) {
    const hasPath = await hasPrerequisitePath(
      prerequisite.prerequisiteCourseId,
      targetCourseId,
      visited,
    );

    if (hasPath) {
      return true;
    }
  }

  return false;
};

const createCoursePrerequisite = async (
  payload: ICreateCoursePrerequisitePayload,
) => {
  if (payload.courseId === payload.prerequisiteCourseId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "A course cannot be its own prerequisite",
    );
  }

  const course = await prisma.course.findUnique({
    where: {
      id: payload.courseId,
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  const prerequisiteCourse = await prisma.course.findUnique({
    where: {
      id: payload.prerequisiteCourseId,
    },
  });

  if (!prerequisiteCourse) {
    throw new AppError(httpStatus.NOT_FOUND, "Prerequisite course not found");
  }

  if (course.departmentId !== prerequisiteCourse.departmentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Prerequisite course must belong to the same department",
    );
  }

  const createsCycle = await hasPrerequisitePath(
    payload.prerequisiteCourseId,
    payload.courseId,
  );

  if (createsCycle) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This prerequisite would create a circular dependency",
    );
  }

  const existingPrerequisite = await prisma.coursePrerequisite.findUnique({
    where: {
      courseId_prerequisiteCourseId: {
        courseId: payload.courseId,
        prerequisiteCourseId: payload.prerequisiteCourseId,
      },
    },
  });

  if (existingPrerequisite) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This prerequisite already exists for the course",
    );
  }

  const coursePrerequisite = await prisma.coursePrerequisite.create({
    data: {
      courseId: payload.courseId,
      prerequisiteCourseId: payload.prerequisiteCourseId,
      minimumGrade: payload.minimumGrade,
    },

    include: {
      course: {
        include: {
          department: true,
        },
      },

      prerequisiteCourse: {
        include: {
          department: true,
        },
      },
    },
  });

  return coursePrerequisite;
};

const getAllCoursePrerequisites = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "minimumGrade",
    "courseId",
    "prerequisiteCourseId",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "minimumGrade";

  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

  const andConditions: CoursePrerequisiteWhereInput[] = [];

  // Course filter
  if (query.courseId) {
    andConditions.push({
      courseId: query.courseId,
    });
  }

  // Prerequisite course filter
  if (query.prerequisiteCourseId) {
    andConditions.push({
      prerequisiteCourseId: query.prerequisiteCourseId,
    });
  }

  // Search
  if (query.searchTerm) {
    andConditions.push({
      OR: [
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
          prerequisiteCourse: {
            code: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          prerequisiteCourse: {
            title: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  const coursePrerequisites = await prisma.coursePrerequisite.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      course: {
        include: {
          department: true,
        },
      },

      prerequisiteCourse: {
        include: {
          department: true,
        },
      },
    },
  });

  const total = await prisma.coursePrerequisite.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: coursePrerequisites,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getCoursePrerequisiteById = async (id: string) => {
  const coursePrerequisite = await prisma.coursePrerequisite.findUnique({
    where: {
      id,
    },

    include: {
      course: {
        include: {
          department: true,
        },
      },

      prerequisiteCourse: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!coursePrerequisite) {
    throw new AppError(httpStatus.NOT_FOUND, "Course prerequisite not found");
  }

  return coursePrerequisite;
};

const getPrerequisitesByCourse = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  const prerequisites = await prisma.coursePrerequisite.findMany({
    where: {
      courseId,
    },

    include: {
      prerequisiteCourse: {
        include: {
          department: true,
        },
      },
    },

    orderBy: {
      prerequisiteCourse: {
        code: "asc",
      },
    },
  });

  return prerequisites;
};

const getCoursesByPrerequisite = async (prerequisiteCourseId: string) => {
  const prerequisiteCourse = await prisma.course.findUnique({
    where: {
      id: prerequisiteCourseId,
    },
  });

  if (!prerequisiteCourse) {
    throw new AppError(httpStatus.NOT_FOUND, "Prerequisite course not found");
  }

  const courses = await prisma.coursePrerequisite.findMany({
    where: {
      prerequisiteCourseId,
    },

    include: {
      course: {
        include: {
          department: true,
        },
      },
    },

    orderBy: {
      course: {
        code: "asc",
      },
    },
  });

  return courses;
};

const updateCoursePrerequisite = async (
  id: string,
  payload: IUpdateCoursePrerequisitePayload,
) => {
  const existing = await prisma.coursePrerequisite.findUnique({
    where: {
      id,
    },

    include: {
      course: true,
      prerequisiteCourse: true,
    },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Course prerequisite not found");
  }

  const courseId = payload.courseId ?? existing.courseId;

  const prerequisiteCourseId =
    payload.prerequisiteCourseId ?? existing.prerequisiteCourseId;

  if (courseId === prerequisiteCourseId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "A course cannot be its own prerequisite",
    );
  }

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  const prerequisiteCourse = await prisma.course.findUnique({
    where: {
      id: prerequisiteCourseId,
    },
  });

  if (!prerequisiteCourse) {
    throw new AppError(httpStatus.NOT_FOUND, "Prerequisite course not found");
  }

  if (course.departmentId !== prerequisiteCourse.departmentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Prerequisite course must belong to the same department",
    );
  }

  if (
    payload.courseId !== undefined ||
    payload.prerequisiteCourseId !== undefined
  ) {
    const duplicate = await prisma.coursePrerequisite.findFirst({
      where: {
        id: {
          not: id,
        },

        courseId,
        prerequisiteCourseId,
      },
    });

    if (duplicate) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This prerequisite already exists for the course",
      );
    }

    const createsCycle = await hasPrerequisitePath(
      prerequisiteCourseId,
      courseId,
    );

    if (createsCycle) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This prerequisite would create a circular dependency",
      );
    }
  }

  const updated = await prisma.coursePrerequisite.update({
    where: {
      id,
    },

    data: {
      ...(payload.courseId !== undefined && {
        courseId: payload.courseId,
      }),

      ...(payload.prerequisiteCourseId !== undefined && {
        prerequisiteCourseId: payload.prerequisiteCourseId,
      }),

      ...(payload.minimumGrade !== undefined && {
        minimumGrade: payload.minimumGrade,
      }),
    },

    include: {
      course: {
        include: {
          department: true,
        },
      },

      prerequisiteCourse: {
        include: {
          department: true,
        },
      },
    },
  });

  return updated;
};

const deleteCoursePrerequisite = async (id: string) => {
  const existing = await prisma.coursePrerequisite.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Course prerequisite not found");
  }

  await prisma.coursePrerequisite.delete({
    where: {
      id,
    },
  });

  return null;
};

export const CoursePrerequisiteService = {
  createCoursePrerequisite,
  getAllCoursePrerequisites,
  getCoursePrerequisiteById,
  getPrerequisitesByCourse,
  getCoursesByPrerequisite,
  updateCoursePrerequisite,
  deleteCoursePrerequisite,
};
