import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import {
  IBulkAttendanceRecordPayload,
  ICreateAttendanceRecordPayload,
  IUpdateAttendanceRecordPayload,
} from "./attendanceRecord.interface";

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

const createAttendanceRecord = async (
  userId: string,
  payload: ICreateAttendanceRecordPayload,
) => {
  const session = await prisma.attendanceSession.findUnique({
    where: {
      id: payload.sessionId,
    },
  });

  if (!session) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance session not found");
  }

  await checkInstructorSectionAccess(userId, session.sectionId);

  const courseRegistration = await prisma.courseRegistration.findUnique({
    where: {
      id: payload.courseRegistrationId,
    },
  });

  if (!courseRegistration) {
    throw new AppError(httpStatus.NOT_FOUND, "Course registration not found");
  }

  if (courseRegistration.sectionId !== session.sectionId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Course registration does not belong to this section",
    );
  }

  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: {
      sessionId_courseRegistrationId: {
        sessionId: payload.sessionId,
        courseRegistrationId: payload.courseRegistrationId,
      },
    },
  });

  if (existingRecord) {
    throw new AppError(httpStatus.CONFLICT, "Attendance record already exists");
  }

  const result = await prisma.attendanceRecord.create({
    data: {
      sessionId: payload.sessionId,

      courseRegistrationId: payload.courseRegistrationId,

      status: payload.status,

      remarks: payload.remarks,
    },

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

      session: {
        include: {
          section: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const getAttendanceRecordById = async (
  userId: string,
  attendanceRecordId: string,
) => {
  const record = await prisma.attendanceRecord.findUnique({
    where: {
      id: attendanceRecordId,
    },

    include: {
      session: {
        include: {
          section: {
            include: {
              course: true,
              semester: true,
            },
          },
        },
      },

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
  });

  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance record not found");
  }

  await checkInstructorSectionAccess(userId, record.session.sectionId);

  return record;
};

const getAttendanceRecordsBySession = async (
  userId: string,
  sessionId: string,
) => {
  const session = await prisma.attendanceSession.findUnique({
    where: {
      id: sessionId,
    },
  });

  if (!session) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance session not found");
  }

  await checkInstructorSectionAccess(userId, session.sectionId);

  const result = await prisma.attendanceRecord.findMany({
    where: {
      sessionId,
    },

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

    orderBy: {
      createdAt: "asc",
    },
  });

  return result;
};

const getStudentsForAttendance = async (userId: string, sessionId: string) => {
  const session = await prisma.attendanceSession.findUnique({
    where: {
      id: sessionId,
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

  if (!session) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance session not found");
  }

  await checkInstructorSectionAccess(userId, session.sectionId);

  const registrations = await prisma.courseRegistration.findMany({
    where: {
      sectionId: session.sectionId,
    },

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

      attendanceRecords: {
        where: {
          sessionId,
        },
      },
    },

    orderBy: {
      registeredAt: "asc",
    },
  });

  return registrations;
};

const createBulkAttendanceRecords = async (
  userId: string,
  payload: IBulkAttendanceRecordPayload,
) => {
  const session = await prisma.attendanceSession.findUnique({
    where: {
      id: payload.sessionId,
    },
  });

  if (!session) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance session not found");
  }

  await checkInstructorSectionAccess(userId, session.sectionId);

  const registrationIds = payload.records.map(
    (record) => record.courseRegistrationId,
  );

  const uniqueRegistrationIds = new Set(registrationIds);

  if (uniqueRegistrationIds.size !== registrationIds.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Duplicate course registration IDs are not allowed",
    );
  }

  const courseRegistrations = await prisma.courseRegistration.findMany({
    where: {
      id: {
        in: registrationIds,
      },

      sectionId: session.sectionId,
    },
  });

  if (courseRegistrations.length !== registrationIds.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "One or more course registrations do not belong to this section",
    );
  }

  const existingRecords = await prisma.attendanceRecord.findMany({
    where: {
      sessionId: payload.sessionId,

      courseRegistrationId: {
        in: registrationIds,
      },
    },
  });

  if (existingRecords.length > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Attendance has already been recorded for one or more students",
    );
  }

  const data = payload.records.map((record) => ({
    sessionId: payload.sessionId,

    courseRegistrationId: record.courseRegistrationId,

    status: record.status,

    remarks: record.remarks,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.attendanceRecord.createMany({
      data,
    });
  });

  return prisma.attendanceRecord.findMany({
    where: {
      sessionId: payload.sessionId,
    },

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

    orderBy: {
      createdAt: "asc",
    },
  });
};

const updateAttendanceRecord = async (
  userId: string,
  attendanceRecordId: string,
  payload: IUpdateAttendanceRecordPayload,
) => {
  const record = await prisma.attendanceRecord.findUnique({
    where: {
      id: attendanceRecordId,
    },

    include: {
      session: true,
    },
  });

  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance record not found");
  }

  await checkInstructorSectionAccess(userId, record.session.sectionId);

  const result = await prisma.attendanceRecord.update({
    where: {
      id: attendanceRecordId,
    },

    data: {
      status: payload.status,
      remarks: payload.remarks,
    },

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

      session: {
        include: {
          section: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const deleteAttendanceRecord = async (
  userId: string,
  attendanceRecordId: string,
) => {
  const record = await prisma.attendanceRecord.findUnique({
    where: {
      id: attendanceRecordId,
    },

    include: {
      session: true,
    },
  });

  if (!record) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance record not found");
  }

  await checkInstructorSectionAccess(userId, record.session.sectionId);

  await prisma.attendanceRecord.delete({
    where: {
      id: attendanceRecordId,
    },
  });

  return null;
};

const getStudentAttendance = async (studentId: string) => {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      courseRegistration: {
        registration: {
          studentId,
        },
      },
    },

    include: {
      session: {
        include: {
          section: {
            include: {
              course: true,
              semester: true,
            },
          },
        },
      },

      courseRegistration: {
        include: {
          registration: true,
        },
      },
    },

    orderBy: [
      {
        session: {
          date: "desc",
        },
      },
    ],
  });

  return records;
};

export const AttendanceRecordService = {
  createAttendanceRecord,
  getAttendanceRecordById,
  getAttendanceRecordsBySession,
  getStudentsForAttendance,
  createBulkAttendanceRecords,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getStudentAttendance,
};
