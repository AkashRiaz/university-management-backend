import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { normalizeAttendanceDate } from "./attendanceSession.utils";
import {
  ICreateAttendanceSessionPayload,
  IUpdateAttendanceSessionPayload,
} from "./attendanceSession.interface";

const checkInstructorSectionAccess = async (
  userId: string,
  sectionId: string,
) => {
  const instructor = await prisma.instructorProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!instructor) {
    throw new AppError(httpStatus.FORBIDDEN, "Instructor profile not found");
  }

  const assignment = await prisma.sectionInstructor.findUnique({
    where: {
      sectionId_instructorId: {
        sectionId,
        instructorId: instructor.id,
      },
    },
  });

  if (!assignment) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not assigned to this section",
    );
  }

  return instructor;
};

const createAttendanceSession = async (
  userId: string,
  payload: ICreateAttendanceSessionPayload,
) => {
  await checkInstructorSectionAccess(userId, payload.sectionId);

  const section = await prisma.section.findUnique({
    where: {
      id: payload.sectionId,
    },
  });

  if (!section) {
    throw new AppError(httpStatus.NOT_FOUND, "Section not found");
  }

  const date = normalizeAttendanceDate(payload.date);

  const existingSession = await prisma.attendanceSession.findUnique({
    where: {
      sectionId_date: {
        sectionId: payload.sectionId,
        date,
      },
    },
  });

  if (existingSession) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Attendance session already exists for this date",
    );
  }

  const result = await prisma.attendanceSession.create({
    data: {
      sectionId: payload.sectionId,
      date,
      topic: payload.topic,
    },

    include: {
      section: {
        include: {
          course: true,
          semester: true,
        },
      },
    },
  });

  return result;
};

const getAttendanceSessionsBySection = async (
  userId: string,
  sectionId: string,
) => {
  await checkInstructorSectionAccess(userId, sectionId);

  const section = await prisma.section.findUnique({
    where: {
      id: sectionId,
    },
  });

  if (!section) {
    throw new AppError(httpStatus.NOT_FOUND, "Section not found");
  }

  return prisma.attendanceSession.findMany({
    where: {
      sectionId,
    },

    include: {
      _count: {
        select: {
          records: true,
        },
      },
    },

    orderBy: {
      date: "desc",
    },
  });
};

const getAttendanceSessionById = async (
  userId: string,
  attendanceSessionId: string,
) => {
  const session = await prisma.attendanceSession.findUnique({
    where: {
      id: attendanceSessionId,
    },

    include: {
      section: {
        include: {
          course: true,
          semester: true,
        },
      },

      records: {
        include: {
          courseRegistration: {
            include: {
              registration: {
                include: {
                  student: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance session not found");
  }

  await checkInstructorSectionAccess(userId, session.sectionId);

  return session;
};

const updateAttendanceSession = async (
  attendanceSessionId: string,
  payload: IUpdateAttendanceSessionPayload,
) => {
  const existingSession = await prisma.attendanceSession.findUnique({
    where: {
      id: attendanceSessionId,
    },

    include: {
      records: true,
    },
  });

  if (!existingSession) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance session not found");
  }

  const data: IUpdateAttendanceSessionPayload = {
    ...payload,
  };

  if (payload.date) {
    data.date = normalizeAttendanceDate(payload.date);

    const duplicateSession = await prisma.attendanceSession.findUnique({
      where: {
        sectionId_date: {
          sectionId: existingSession.sectionId,
          date: data.date,
        },
      },
    });

    if (duplicateSession && duplicateSession.id !== attendanceSessionId) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Attendance session already exists for this date",
      );
    }
  }

  const result = await prisma.attendanceSession.update({
    where: {
      id: attendanceSessionId,
    },

    data,

    include: {
      section: {
        include: {
          course: true,
          semester: true,
        },
      },

      records: true,
    },
  });

  return result;
};

const deleteAttendanceSession = async (attendanceSessionId: string) => {
  const session = await prisma.attendanceSession.findUnique({
    where: {
      id: attendanceSessionId,
    },

    include: {
      records: true,
    },
  });

  if (!session) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance session not found");
  }

  if (session.records.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete attendance session because attendance records already exist",
    );
  }

  await prisma.attendanceSession.delete({
    where: {
      id: attendanceSessionId,
    },
  });

  return null;
};

export const AttendanceSessionService = {
  createAttendanceSession,
  getAttendanceSessionsBySection,
  updateAttendanceSession,
  getAttendanceSessionById,
  deleteAttendanceSession,
};
