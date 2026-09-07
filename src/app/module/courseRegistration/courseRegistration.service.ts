import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import {
  CourseRegistrationStatus,
  RegistrationStatus,
  SectionStatus,
} from "../../../generated/prisma/enums";
import { ICreateCourseRegistrationPayload } from "./courseRegistration.interface";

const getAvailableCoursesForRegistration = async (
  userId: string,
  registrationId: string,
) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, "Student profile not found");
  }

  const registration = await prisma.registration.findUnique({
    where: {
      id: registrationId,
    },
  });

  if (!registration) {
    throw new AppError(httpStatus.NOT_FOUND, "Registration not found");
  }

  if (registration.studentId !== student.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not allowed to access this registration",
    );
  }

  /*
   * Get semester courses
   */
  const programCourses = await prisma.programCourse.findMany({
    where: {
      programId: student.programId,
      semesterNumber: registration.programSemesterNumber,
    },

    include: {
      course: true,
    },
  });

  /*
   * Extract course ids
   */
  const courseIds = programCourses.map((item) => item.courseId);

  /*
   * Find actual sections
   */
  const sections = await prisma.section.findMany({
    where: {
      semesterId: registration.semesterId,
      courseId: {
        in: courseIds,
      },
      status: SectionStatus.OPEN,
    },

    include: {
      course: true,

      schedules: true,

      room: true,

      instructors: {
        include: {
          instructor: true,
        },
      },
    },
  });

  return {
    programSemesterNumber: registration.programSemesterNumber,
    semesterId: registration.semesterId,
    courses: programCourses,
    sections,
  };
};

const createCourseRegistration = async (
  userId: string,
  payload: ICreateCourseRegistrationPayload,
) => {
  const { registrationId, sectionId } = payload;

  return prisma.$transaction(
    async (tx) => {
      const student = await tx.studentProfile.findUnique({
        where: {
          userId,
        },
      });

      if (!student) {
        throw new AppError(404, "Student profile not found");
      }

      const registration = await tx.registration.findUnique({
        where: {
          id: registrationId,
        },
      });

      if (!registration) {
        throw new AppError(404, "Registration not found");
      }

      if (registration.studentId !== student.id) {
        throw new AppError(
          403,
          "You are not allowed to modify this registration",
        );
      }

      if (registration.status !== RegistrationStatus.DRAFT) {
        throw new AppError(
          400,
          "Courses can only be added while registration is in draft status",
        );
      }

      const section = await tx.section.findUnique({
        where: {
          id: sectionId,
        },

        include: {
          course: {
            include: {
              programs: true,
            },
          },
        },
      });

      if (!section) {
        throw new AppError(404, "Section not found");
      }

      if (section.semesterId !== registration.semesterId) {
        throw new AppError(
          400,
          "Selected section does not belong to this semester",
        );
      }

      if (section.status !== SectionStatus.OPEN) {
        throw new AppError(400, "Selected section is not open");
      }

      const isProgramCourse = section.course.programs.some(
        (programCourse) =>
          programCourse.programId === student.programId &&
          programCourse.semesterNumber === registration.programSemesterNumber,
      );

      if (!isProgramCourse) {
        throw new AppError(
          400,
          "This course is not available for your program",
        );
      }

      const existing = await tx.courseRegistration.findUnique({
        where: {
          registrationId_sectionId: {
            registrationId,
            sectionId,
          },
        },
      });

      if (existing) {
        throw new AppError(409, "This section is already registered");
      }

      const existingSameCourse = await tx.courseRegistration.findFirst({
        where: {
          registrationId,

          section: {
            courseId: section.courseId,
          },

          status: {
            not: CourseRegistrationStatus.DROPPED,
          },
        },
      });

      if (existingSameCourse) {
        throw new AppError(
          409,
          "You have already registered this course in another section",
        );
      }

      // Atomic capacity update
      const updatedSection = await tx.section.updateMany({
        where: {
          id: sectionId,

          status: SectionStatus.OPEN,

          enrolledCount: {
            lt: section.capacity,
          },
        },

        data: {
          enrolledCount: {
            increment: 1,
          },
        },
      });

      if (updatedSection.count === 0) {
        throw new AppError(400, "This section is full");
      }

      const result = await tx.courseRegistration.create({
        data: {
          registrationId,

          sectionId,

          status: CourseRegistrationStatus.REGISTERED,
        },

        include: {
          section: {
            include: {
              course: true,
              department: true,
              room: true,
            },
          },

          registration: {
            include: {
              semester: true,
            },
          },
        },
      });

      return result;
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );
};

const getMyCourseRegistrations = async (
  userId: string,
  registrationId: string,
) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const registration = await prisma.registration.findUnique({
    where: {
      id: registrationId,
    },
  });

  if (!registration) {
    throw new AppError(404, "Registration not found");
  }

  if (registration.studentId !== student.id) {
    throw new AppError(403, "You are not allowed to view this registration");
  }

  const courses = await prisma.courseRegistration.findMany({
    where: {
      registrationId,
    },

    orderBy: {
      registeredAt: "desc",
    },

    include: {
      section: {
        include: {
          course: true,
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

          schedules: true,
        },
      },
    },
  });

  return courses;
};

const getSingleCourseRegistration = async (
  userId: string,
  courseRegistrationId: string,
) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const courseRegistration = await prisma.courseRegistration.findUnique({
    where: {
      id: courseRegistrationId,
    },

    include: {
      registration: true,

      section: {
        include: {
          course: true,
          department: true,
          room: true,
          schedules: true,

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
      },
    },
  });

  if (!courseRegistration) {
    throw new AppError(404, "Course registration not found");
  }

  if (courseRegistration.registration.studentId !== student.id) {
    throw new AppError(
      403,
      "You are not allowed to view this course registration",
    );
  }

  return courseRegistration;
};

const dropCourseRegistration = async (
  userId: string,
  courseRegistrationId: string,
) => {
  return prisma.$transaction(
    async (tx) => {
      const student = await tx.studentProfile.findUnique({
        where: {
          userId,
        },
      });

      if (!student) {
        throw new AppError(404, "Student profile not found");
      }

      const courseRegistration = await tx.courseRegistration.findUnique({
        where: {
          id: courseRegistrationId,
        },

        include: {
          registration: true,
        },
      });

      if (!courseRegistration) {
        throw new AppError(404, "Course registration not found");
      }

      if (courseRegistration.registration.studentId !== student.id) {
        throw new AppError(403, "You are not allowed to drop this course");
      }

      if (courseRegistration.status !== CourseRegistrationStatus.REGISTERED) {
        throw new AppError(400, "Only registered courses can be dropped");
      }

      const result = await tx.courseRegistration.update({
        where: {
          id: courseRegistrationId,
        },

        data: {
          status: CourseRegistrationStatus.DROPPED,

          droppedAt: new Date(),
        },
      });

      await tx.section.update({
        where: {
          id: courseRegistration.sectionId,
        },

        data: {
          enrolledCount: {
            decrement: 1,
          },
        },
      });

      return result;
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );
};

export const CourseRegistrationService = {
  getAvailableCoursesForRegistration,
  createCourseRegistration,
  getMyCourseRegistrations,
  getSingleCourseRegistration,
  dropCourseRegistration,
};
