import { Prisma } from "../../../generated/prisma/client";
import { ApplicationStatus } from "../../../generated/prisma/enums";
import { StudentScholarshipWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateStudentScholarshipPayload,
  IUpdateStudentScholarshipPayload,
} from "./studentScholarship.interface";
import httpStatus from "http-status";

/**
 * createStudentScholarship
 *
 * semesterId is now REQUIRED on StudentScholarship.
 * Every scholarship amount is a snapshot calculated against
 * that specific semester's FeeStructure.
 */
const createStudentScholarship = async (
  payload: ICreateStudentScholarshipPayload,
) => {
  /*
   * 1. Check student
   */
  const student = await prisma.studentProfile.findUnique({
    where: {
      id: payload.studentId,
    },
  });

  if (!student) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Student not found",
    );
  }

  if (!student.programId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Student is not assigned to a program",
    );
  }

  /*
   * 2. Check scholarship
   */
  const scholarship = await prisma.scholarship.findUnique({
    where: {
      id: payload.scholarshipId,
    },
  });

  if (!scholarship) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Scholarship not found",
    );
  }

  /*
   * 3. Scholarship must be active
   */
  if (scholarship.status !== "ACTIVE") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This scholarship is not active",
    );
  }

  /*
   * 4. Semester is required — validate it exists
   */
  const semester = await prisma.semester.findUnique({
    where: {
      id: payload.semesterId,
    },
  });

  if (!semester) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Semester not found",
    );
  }

  /*
   * 5. Check duplicate scholarship assignment
   *    (same student + same scholarship + same semester)
   */
  const existing = await prisma.studentScholarship.findFirst({
    where: {
      studentId: payload.studentId,
      scholarshipId: payload.scholarshipId,
      semesterId: payload.semesterId,
    },
  });

  if (existing) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This scholarship is already assigned to this student for this semester",
    );
  }

  /*
   * 6. Calculate scholarship amount
   */
  let scholarshipAmount: Prisma.Decimal;

  /*
   * FIXED AMOUNT SCHOLARSHIP
   *
   * Example:
   * fixedAmount = 10,000
   * Scholarship amount = 10,000
   */
  if (scholarship.fixedAmount !== null) {
    scholarshipAmount = new Prisma.Decimal(
      scholarship.fixedAmount,
    );
  }

  /*
   * PERCENTAGE SCHOLARSHIP
   *
   * Example:
   * Total Fee = 60,000
   * Scholarship = 25%
   * 60,000 × 25 / 100 = 15,000
   */
  else if (scholarship.percentage !== null) {
    /*
     * Find applicable FeeStructure for this exact semester.
     * If a semester-specific FeeStructure doesn't exist,
     * fall back to the program's general FeeStructure
     * (semesterId: null) — that fallback lives here, in
     * pricing lookup, not in what we store on the award.
     */
    let feeStructure = await prisma.feeStructure.findFirst({
      where: {
        programId: student.programId,
        semesterId: payload.semesterId,
      },
      include: {
        items: true,
      },
    });

    // if (!feeStructure) {
    //   feeStructure = await prisma.feeStructure.findFirst({
    //     where: {
    //       programId: student.programId,
    //       semesterId: null,
    //     },
    //     include: {
    //       items: true,
    //     },
    //   });
    // }

    if (!feeStructure) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Fee structure not found for this student's program/semester",
      );
    }

    /*
     * Calculate total fee
     *
     * Example:
     * Tuition = 40,000
     * Lab     = 10,000
     * Exam    = 5,000
     * Total   = 55,000
     */
    const totalFee = feeStructure.items.reduce(
      (total, item) => total.plus(item.amount),
      new Prisma.Decimal(0),
    );

    /*
     * Calculate percentage scholarship
     * totalFee × percentage / 100
     */
    scholarshipAmount = totalFee
      .mul(scholarship.percentage)
      .div(100);
  }

  /*
   * 7. Neither fixed amount nor percentage exists
   */
  else {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Scholarship must have either a fixed amount or percentage",
    );
  }

  /*
   * 8. Create StudentScholarship
   */
  const studentScholarship = await prisma.studentScholarship.create({
    data: {
      studentId: payload.studentId,
      scholarshipId: payload.scholarshipId,
      semesterId: payload.semesterId, // always required now

      amount: scholarshipAmount,

      status: payload.status ?? ApplicationStatus.PENDING,
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

      scholarship: true,

      semester: true,
    },
  });

  return studentScholarship;
};


const getAllStudentScholarships = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = ["amount", "status"];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "amount";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: StudentScholarshipWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
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
        {
          scholarship: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
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

  if (query.scholarshipId) {
    andConditions.push({
      scholarshipId: query.scholarshipId,
    });
  }

  if (query.semesterId) {
    andConditions.push({
      semesterId: query.semesterId,
    });
  }

  if (query.status) {
    andConditions.push({
      status: query.status as ApplicationStatus,
    });
  }

  const studentScholarships = await prisma.studentScholarship.findMany({
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

      scholarship: true,

      semester: true,
    },
  });

  const total = await prisma.studentScholarship.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: studentScholarships,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleStudentScholarship = async (id: string) => {
  const studentScholarship = await prisma.studentScholarship.findUnique({
    where: {
      id,
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

      scholarship: true,

      semester: true,
    },
  });

  if (!studentScholarship) {
    throw new AppError(httpStatus.NOT_FOUND, "Student scholarship not found");
  }

  return studentScholarship;
};

const updateStudentScholarship = async (
  id: string,
  payload: IUpdateStudentScholarshipPayload,
) => {
  /* 
   * 1. Check existing student scholarship
   */
  const existing =
    await prisma.studentScholarship.findUnique({
      where: {
        id,
      },
    });

  if (!existing) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Student scholarship not found",
    );
  }

  /* 
   * 2. Check student
   */
  const student =
    await prisma.studentProfile.findUnique({
      where: {
        id: existing.studentId,
      },
    });

  if (!student) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Student not found",
    );
  }

  if (!student.programId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Student is not assigned to a program",
    );
  }

  /* 
   * 3. Check scholarship
   */
  const scholarship =
    await prisma.scholarship.findUnique({
      where: {
        id: existing.scholarshipId,
      },
    });

  if (!scholarship) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Scholarship not found",
    );
  }

  /* 
   * 4. Scholarship must be active
   */
  if (scholarship.status !== "ACTIVE") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This scholarship is not active",
    );
  }

  /* 
   * 5. Determine semester
   */
  const semesterId =
    payload.semesterId ??
    existing.semesterId;

  if (!semesterId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Semester is required",
    );
  }

  const semester =
    await prisma.semester.findUnique({
      where: {
        id: semesterId,
      },
    });

  if (!semester) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Semester not found",
    );
  }

  /* 
   * 6. Check duplicate scholarship assignment
   *    (same student + same scholarship + same semester)
   */
  if (payload.semesterId !== undefined) {
    const duplicate =
      await prisma.studentScholarship.findFirst({
        where: {
          id: {
            not: id,
          },

          studentId: existing.studentId,

          scholarshipId:
            existing.scholarshipId,

          semesterId,
        },
      });

    if (duplicate) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This scholarship is already assigned to this student for this semester",
      );
    }
  }

  /* 
   * 7. Calculate scholarship amount
   */
  let scholarshipAmount: Prisma.Decimal;

  /*
   * FIXED AMOUNT SCHOLARSHIP
   */
  if (scholarship.fixedAmount !== null) {
    scholarshipAmount = new Prisma.Decimal(
      scholarship.fixedAmount,
    );
  }

  /*
   * PERCENTAGE SCHOLARSHIP
   */
  else if (scholarship.percentage !== null) {
    /*
     * Find applicable FeeStructure for this
     * student's program and semester.
     */
    const feeStructure =
      await prisma.feeStructure.findFirst({
        where: {
          programId: student.programId,

          semesterId,
        },

        include: {
          items: true,
        },
      });

    if (!feeStructure) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Fee structure not found for this student's program/semester",
      );
    }

    /*
     * Calculate total fee
     */
    const totalFee =
      feeStructure.items.reduce(
        (total, item) =>
          total.plus(item.amount),
        new Prisma.Decimal(0),
      );

    /*
     * Calculate percentage scholarship
     */
    scholarshipAmount = totalFee
      .mul(scholarship.percentage)
      .div(100);
  }

  /*
   * 8. Neither fixed amount nor percentage exists
   */
  else {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Scholarship must have either a fixed amount or percentage",
    );
  }

  /* 
   * 9. Prepare update data
   */
  const data: Prisma.StudentScholarshipUpdateInput =
    {
      amount: scholarshipAmount,
    };

  if (payload.semesterId !== undefined) {
    data.semester = {
      connect: {
        id: payload.semesterId!,
      },
    };
  }

  if (payload.status !== undefined) {
    data.status = payload.status;
  }

  /* 
   * 10. Update StudentScholarship
   */
  const studentScholarship =
    await prisma.studentScholarship.update({
      where: {
        id,
      },

      data,

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

        scholarship: true,

        semester: true,
      },
    });

  return studentScholarship;
};

const deleteStudentScholarship = async (id: string) => {
  const existing = await prisma.studentScholarship.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Student scholarship not found");
  }

  await prisma.studentScholarship.delete({
    where: {
      id,
    },
  });

  return null;
};

export const StudentScholarshipService = {
  createStudentScholarship,
  getAllStudentScholarships,
  getSingleStudentScholarship,
  updateStudentScholarship,
  deleteStudentScholarship,
};
