import { CourseWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateCoursePayload, IUpdateCoursePayload } from "./course.interface";
import httpStatus from "http-status";

const createCourse = async (payload: ICreateCoursePayload) => {
  const department = await prisma.department.findUnique({
    where: {
      id: payload.departmentId,
    },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  const existingCourse = await prisma.course.findUnique({
    where: {
      departmentId_code: {
        departmentId: payload.departmentId,
        code: payload.code,
      },
    },
  });

  if (existingCourse) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Course with this code already exists in this department",
    );
  }

  const course = await prisma.course.create({
    data: {
      code: payload.code,
      title: payload.title,
      description: payload.description,
      credit: payload.credit,
      courseType: payload.courseType,
      courseLevel: payload.courseLevel,
      departmentId: payload.departmentId,
    },

    include: {
      department: true,
    },
  });

  return course;
};

const getAllCourses = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;
  const page = query.page ? parseInt(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "desc" ? "desc" : "asc";

  const andConditions: CourseWhereInput[] = [];

  // Search
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          code: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          title: {
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

  // Department filter
  if (query.departmentId) {
    andConditions.push({
      departmentId: query.departmentId,
    });
  }

  // Course type filter
  if (query.courseType) {
    andConditions.push({
      courseType: query.courseType,
    });
  }

  // Course level filter
  if (query.courseLevel) {
    andConditions.push({
      courseLevel: query.courseLevel,
    });
  }

  const courses = await prisma.course.findMany({
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

  const total = await prisma.course.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: courses,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getCourseById = async (id: string) => {
  const course = await prisma.course.findUnique({
    where: {
      id,
    },

    include: {
      department: true,

      programs: {
        include: {
          program: true,
        },
      },

      prerequisites: {
        include: {
          prerequisiteCourse: true,
        },
      },

      requiredFor: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  return course;
};

const updateCourse = async (id: string, payload: IUpdateCoursePayload) => {
  const existingCourse = await prisma.course.findUnique({
    where: {
      id,
    },
  });

  if (!existingCourse) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

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

  const departmentId = payload.departmentId ?? existingCourse.departmentId;

  const code = payload.code ?? existingCourse.code;

  const duplicateCourse = await prisma.course.findFirst({
    where: {
      id: {
        not: id,
      },

      departmentId,

      code,
    },
  });

  if (duplicateCourse) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Course with this code already exists in this department",
    );
  }

  const course = await prisma.course.update({
    where: {
      id,
    },

    data: {
      ...(payload.code !== undefined && {
        code: payload.code,
      }),

      ...(payload.title !== undefined && {
        title: payload.title,
      }),

      ...(payload.description !== undefined && {
        description: payload.description,
      }),

      ...(payload.credit !== undefined && {
        credit: payload.credit,
      }),

      ...(payload.courseType !== undefined && {
        courseType: payload.courseType,
      }),

      ...(payload.courseLevel !== undefined && {
        courseLevel: payload.courseLevel,
      }),

      ...(payload.departmentId !== undefined && {
        departmentId: payload.departmentId,
      }),
    },

    include: {
      department: true,
    },
  });

  return course;
};

const deleteCourse = async (id: string) => {
  const course = await prisma.course.findUnique({
    where: {
      id,
    },

    include: {
      programs: true,
      prerequisites: true,
      requiredFor: true,
      sections: true,
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  if (
    course.programs.length > 0 ||
    course.prerequisites.length > 0 ||
    course.requiredFor.length > 0 ||
    course.sections.length > 0
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete a course that is already being used",
    );
  }

  await prisma.course.delete({
    where: {
      id,
    },
  });

  return null;
};

export const CourseService = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
