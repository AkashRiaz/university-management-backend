import { ProgramCourseWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateProgramCoursePayload,
  IUpdateProgramCoursePayload,
} from "./programCourse.interface";
import httpStatus from "http-status";

const createProgramCourse = async (payload: ICreateProgramCoursePayload) => {
  const program = await prisma.program.findUnique({
    where: {
      id: payload.programId,
    },
  });

  if (!program) {
    throw new AppError(httpStatus.NOT_FOUND, "Program not found");
  }

  const course = await prisma.course.findUnique({
    where: {
      id: payload.courseId,
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  // Program and Course should belong to
  // the same department.
  if (program.departmentId !== course.departmentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Course does not belong to the same department as the program",
    );
  }

  const existingProgramCourse = await prisma.programCourse.findUnique({
    where: {
      programId_courseId: {
        programId: payload.programId,
        courseId: payload.courseId,
      },
    },
  });

  if (existingProgramCourse) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This course is already assigned to the program",
    );
  }

  const programCourse = await prisma.programCourse.create({
    data: {
      programId: payload.programId,
      courseId: payload.courseId,
      semesterNumber: payload.semesterNumber,
      isRequired: payload.isRequired ?? true,
    },

    include: {
      program: {
        include: {
          department: true,
        },
      },

      course: {
        include: {
          department: true,
        },
      },
    },
  });

  return programCourse;
};

const getAllProgramCourses = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;
  const page = query.page ? parseInt(query.page) : 1;
  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "id",
    "programId",
    "courseId",
    "semesterNumber",
    "isRequired",
  ];

  const sortBy = allowedSortFields.includes(
    query.sortBy || "",
  )
    ? query.sortBy!
    : "semesterNumber";

  const sortOrder =
    query.sortOrder === "desc"
      ? "desc"
      : "asc";

  const andConditions: ProgramCourseWhereInput[] = [];

  // Program filter
  if (query.programId) {
    andConditions.push({
      programId: query.programId,
    });
  }

  // Course filter
  if (query.courseId) {
    andConditions.push({
      courseId: query.courseId,
    });
  }

  // Semester filter
  if (query.semesterNumber) {
    andConditions.push({
      semesterNumber: Number(
        query.semesterNumber,
      ),
    });
  }

  // Required course filter
  if (query.isRequired !== undefined) {
    andConditions.push({
      isRequired:
        query.isRequired === true ||
        query.isRequired === "true",
    });
  }

  // Search
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          program: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          program: {
            code: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
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
      ],
    });
  }

  const programCourses =
    await prisma.programCourse.findMany({
      where: {
        AND: andConditions,
      },

      take: limit,
      skip,

      orderBy: {
        [sortBy]: sortOrder,
      },

      include: {
        program: {
          include: {
            department: true,
          },
        },

        course: {
          include: {
            department: true,
          },
        },
      },
    });

  const total =
    await prisma.programCourse.count({
      where: {
        AND: andConditions,
      },
    });

  return {
    data: programCourses,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(
        total / limit,
      ),
    },
  };
};
const getProgramCourseById = async (id: string) => {
  const programCourse = await prisma.programCourse.findUnique({
    where: {
      id,
    },

    include: {
      program: {
        include: {
          department: true,
        },
      },

      course: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!programCourse) {
    throw new AppError(httpStatus.NOT_FOUND, "Program course not found");
  }

  return programCourse;
};

const getCoursesByProgram = async (programId: string, query: IQuery) => {
  const program = await prisma.program.findUnique({
    where: {
      id: programId,
    },
  });

  if (!program) {
    throw new AppError(httpStatus.NOT_FOUND, "Program not found");
  }

  const andConditions: ProgramCourseWhereInput[] = [
    {
      programId,
    },
  ];

  // Semester filter
  if (query.semesterNumber) {
    andConditions.push({
      semesterNumber: Number(query.semesterNumber),
    });
  }

  // Required course filter
  if (query.isRequired !== undefined) {
    andConditions.push({
      isRequired: query.isRequired === true || query.isRequired === "true",
    });
  }

  const programCourses = await prisma.programCourse.findMany({
    where: {
      AND: andConditions,
    },

    include: {
      course: true,
    },

    orderBy: {
      semesterNumber: "asc",
    },
  });

  return programCourses;
};

const getProgramsByCourse = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  const programCourses = await prisma.programCourse.findMany({
    where: {
      courseId,
    },

    include: {
      program: {
        include: {
          department: true,
        },
      },
    },

    orderBy: {
      program: {
        name: "asc",
      },
    },
  });

  return programCourses;
};

const updateProgramCourse = async (
  id: string,
  payload: IUpdateProgramCoursePayload,
) => {
  const existingProgramCourse = await prisma.programCourse.findUnique({
    where: {
      id,
    },

    include: {
      program: true,
      course: true,
    },
  });

  if (!existingProgramCourse) {
    throw new AppError(httpStatus.NOT_FOUND, "Program course not found");
  }

  const programId = payload.programId ?? existingProgramCourse.programId;

  const courseId = payload.courseId ?? existingProgramCourse.courseId;

  const program = await prisma.program.findUnique({
    where: {
      id: programId,
    },
  });

  if (!program) {
    throw new AppError(httpStatus.NOT_FOUND, "Program not found");
  }

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  if (program.departmentId !== course.departmentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Course does not belong to the same department as the program",
    );
  }

  if (payload.programId !== undefined || payload.courseId !== undefined) {
    const duplicateProgramCourse = await prisma.programCourse.findFirst({
      where: {
        id: {
          not: id,
        },

        programId,
        courseId,
      },
    });

    if (duplicateProgramCourse) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This course is already assigned to the program",
      );
    }
  }

  const updatedProgramCourse = await prisma.programCourse.update({
    where: {
      id,
    },

    data: {
      ...(payload.programId !== undefined && {
        programId: payload.programId,
      }),

      ...(payload.courseId !== undefined && {
        courseId: payload.courseId,
      }),

      ...(payload.semesterNumber !== undefined && {
        semesterNumber: payload.semesterNumber,
      }),

      ...(payload.isRequired !== undefined && {
        isRequired: payload.isRequired,
      }),
    },

    include: {
      program: {
        include: {
          department: true,
        },
      },

      course: {
        include: {
          department: true,
        },
      },
    },
  });

  return updatedProgramCourse;
};

const deleteProgramCourse = async (id: string) => {
  const programCourse = await prisma.programCourse.findUnique({
    where: {
      id,
    },
  });

  if (!programCourse) {
    throw new AppError(httpStatus.NOT_FOUND, "Program course not found");
  }

  await prisma.programCourse.delete({
    where: {
      id,
    },
  });

  return null;
};

export const ProgramCourseService = {
  createProgramCourse,
  getAllProgramCourses,
  getProgramCourseById,
  getCoursesByProgram,
  getProgramsByCourse,
  updateProgramCourse,
  deleteProgramCourse,
};
