import {
  RegistrationStatus,
  SectionStatus,
} from "../../../generated/prisma/enums";
import { getSemesterTypeByNumber } from "../../helper/generateSemesterTypeByNumber";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateRegistrationPayload } from "./registration.interface";
import httpStatus from "http-status";
import { generateRegistrationNumber } from "./registration.utils";
import { RegistrationWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";

const createRegistration = async (
  userId: string,
  payload: ICreateRegistrationPayload,
) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, "Student profile not found");
  }

  /*
   * Calculate next program semester
   */
  const currentSemesterNumber = student.currentSemesterNumber ?? 0;

  const nextProgramSemesterNumber = currentSemesterNumber + 1;

  /*
   * Program only has 16 semesters
   */
  if (nextProgramSemesterNumber > 16) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have completed all program semesters",
    );
  }

  /*
   * Find actual academic semester
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
   * Determine expected semester type
   *
   * 1  -> SPRING
   * 2  -> SUMMER
   * 3  -> FALL
   * 4  -> WINTER
   * 5  -> SPRING
   * ...
   */
  const expectedSemesterType = getSemesterTypeByNumber(
    nextProgramSemesterNumber,
  );

  /*
   * Check actual semester type
   */
  if (semester.name !== expectedSemesterType) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Your next program semester is ${nextProgramSemesterNumber}, which must be ${expectedSemesterType}`,
    );
  }

  /*
   * Check existing registration
   */
  const existingRegistration = await prisma.registration.findFirst({
    where: {
      studentId: student.id,
      semesterId: payload.semesterId,
    },
  });

  if (existingRegistration) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You already have a registration for this semester",
    );
  }

  const registrationNumber = generateRegistrationNumber();

  /*
   * Create registration
   */
  const registration = await prisma.registration.create({
    data: {
      studentId: student.id,
      semesterId: payload.semesterId,
      registrationNumber: registrationNumber,
      programSemesterNumber: nextProgramSemesterNumber,
      status: RegistrationStatus.DRAFT,
    },

    include: {
      semester: true,
    },
  });

  return registration;
};

const getMyRegistrations = async (userId: string, query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;
  const page = query.page ? parseInt(query.page) : 1;
  const skip = (page - 1) * limit;

  const allowedSortFields = ["createdAt", "updatedAt", "status"];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  const andConditions: RegistrationWhereInput[] = [];

  // Filter for the logged-in student
  andConditions.push({
    studentId: student.id,
  });

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          courses: {
            some: {
              section: {
                course: {
                  OR: [
                    {
                      title: {
                        contains: query.searchTerm,
                        mode: "insensitive",
                      },
                    },
                    {
                      code: {
                        contains: query.searchTerm,
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    });
  }

  if (query.semesterId) {
    andConditions.push({
      semesterId: query.semesterId,
    });
  }

  if (query.status) {
    andConditions.push({
      status: query.status,
    });
  }

  const registrations = await prisma.registration.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      semester: {
        include: {
          academicYear: true,
        },
      },

      courses: {
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
            },
          },
        },
      },
    },
  });

  const total = await prisma.registration.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: registrations,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAllRegistrations = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;
  const page = query.page ? parseInt(query.page) : 1;
  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "registrationNumber",
    "status",
    "createdAt",
    "updatedAt",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: RegistrationWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          registrationNumber: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          student: {
            studentId: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          student: {
            user: {
              name: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
        {
          student: {
            user: {
              email: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  if (query.studentId) {
    andConditions.push({
      studentId: query.studentId,
    });
  }

  if (query.semesterId) {
    andConditions.push({
      semesterId: query.semesterId,
    });
  }

  if (query.status) {
    andConditions.push({
      status: query.status,
    });
  }

  const registrations = await prisma.registration.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      student: {
        include: {
          user: {
            omit: {
              password: true,
            },
          },

          department: true,

          program: true,
        },
      },

      semester: {
        include: {
          academicYear: true,
        },
      },

      courses: {
        include: {
          section: {
            include: {
              course: true,
              department: true,
              room: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.registration.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: registrations,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleRegistration = async (
  userId: string,
  registrationId: string,
) => {
  const registration = await prisma.registration.findUnique({
    where: {
      id: registrationId,
    },

    include: {
      student: {
        include: {
          user: {
            omit: {
              password: true,
            },
          },

          department: true,

          program: true,
        },
      },

      semester: {
        include: {
          academicYear: true,
        },
      },

      courses: {
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
      },
    },
  });

  if (!registration) {
    throw new AppError(404, "Registration not found");
  }

  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  if (registration.studentId !== student.id) {
    throw new AppError(403, "You are not allowed to view this registration");
  }

  return registration;
};

const submitRegistration = async (userId: string, registrationId: string) => {
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

    include: {
      semester: true,

      courses: {
        include: {
          section: {
            include: {
              course: {
                include: {
                  programs: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!registration) {
    throw new AppError(404, "Registration not found");
  }

  // Ownership
  if (registration.studentId !== student.id) {
    throw new AppError(403, "You are not allowed to submit this registration");
  }

  // Status
  if (registration.status !== RegistrationStatus.DRAFT) {
    throw new AppError(400, "Only draft registration can be submitted");
  }

  // Registration window
  const now = new Date();

  if (
    now < registration.semester.registrationStart ||
    now > registration.semester.registrationEnd
  ) {
    throw new AppError(400, "Registration period is closed");
  }

  // At least one course
  if (registration.courses.length === 0) {
    throw new AppError(
      400,
      "Please select at least one course before submitting",
    );
  }

  // Validate every selected section
  for (const courseRegistration of registration.courses) {
    const section = courseRegistration.section;

    // Section must belong to same semester
    if (section.semesterId !== registration.semesterId) {
      throw new AppError(
        400,
        "Selected section does not belong to this semester",
      );
    }

    // Section must be open
    if (section.status !== SectionStatus.OPEN) {
      throw new AppError(400, `Section ${section.name} is not open`);
    }

    const isProgramCourse = section.course.programs.some(
      (programCourse) =>
        programCourse.programId === student.programId &&
        programCourse.semesterNumber === registration.programSemesterNumber,
    );

    if (!isProgramCourse) {
      throw new AppError(
        400,
        `Course ${section.course.code} is not available for your program`,
      );
    }
  }

  // Find invoice
  const invoice = await prisma.invoice.findFirst({
    where: {
      studentId: student.id,

      semesterId: registration.semesterId,

      status: {
        not: "CANCELLED",
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  if (!invoice) {
    throw new AppError(400, "Invoice not found for this semester");
  }

  // Payment check
  if (Number(invoice.dueAmount) > 0) {
    throw new AppError(
      400,
      "Please complete your semester payment before submitting registration",
    );
  }

  // Submit
  const updatedRegistration = await prisma.registration.update({
    where: {
      id: registrationId,
    },

    data: {
      status: RegistrationStatus.PENDING,

      submittedAt: new Date(),
    },

    include: {
      semester: true,

      courses: {
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

  return updatedRegistration;
};

const approveRegistration = async (registrationId: string) => {
  const registration = await prisma.registration.findUnique({
    where: {
      id: registrationId,
    },

    include: {
      student: true,

      semester: true,

      courses: {
        include: {
          section: true,
        },
      },
    },
  });

  if (!registration) {
    throw new AppError(404, "Registration not found");
  }

  if (registration.status !== RegistrationStatus.PENDING) {
    throw new AppError(400, "Only pending registration can be approved");
  }

  if (registration.courses.length === 0) {
    throw new AppError(400, "Registration has no courses");
  }

  // Check invoice again
  const invoice = await prisma.invoice.findFirst({
    where: {
      studentId: registration.studentId,

      semesterId: registration.semesterId,

      status: {
        not: "CANCELLED",
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  if (!invoice) {
    throw new AppError(400, "Invoice not found");
  }

  if (Number(invoice.dueAmount) > 0) {
    throw new AppError(400, "Student has outstanding payment");
  }

  // Approve
  const updatedRegistration = await prisma.registration.update({
    where: {
      id: registrationId,
    },

    data: {
      status: RegistrationStatus.APPROVED,

      approvedAt: new Date(),
    },

    include: {
      student: {
        include: {
          user: {
            omit: {
              password: true,
            },
          },
        },
      },

      semester: true,

      courses: {
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

  return updatedRegistration;
};

const rejectRegistration = async (registrationId: string) => {
  const registration = await prisma.registration.findUnique({
    where: {
      id: registrationId,
    },
  });

  if (!registration) {
    throw new AppError(404, "Registration not found");
  }

  if (registration.status !== RegistrationStatus.PENDING) {
    throw new AppError(400, "Only pending registration can be rejected");
  }

  const updatedRegistration = await prisma.registration.update({
    where: {
      id: registrationId,
    },

    data: {
      status: RegistrationStatus.REJECTED,
    },
  });

  return updatedRegistration;
};

export const RegistrationService = {
  createRegistration,
  getMyRegistrations,
  getAllRegistrations,
  getSingleRegistration,
  submitRegistration,
  approveRegistration,
  rejectRegistration,
};
