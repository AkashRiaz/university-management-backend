import { generateRandomPassword } from "../../helper/generateRandomPassword";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateStudentPayload,
  IUpdateStudentAdminPayload,
  IUpdateStudentSelfPayload,
} from "./student.interface";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { config } from "../../config";
import crypto from "crypto";
import {
  AuthProvider,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import { generateStudentId } from "../../helper/generateStudentId";
import { redisClient } from "../../lib/redis";
import path from "path";
import ejs from "ejs";
import { transporter } from "../../lib/nodemailer";
import { StudentProfileWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { cloudinary } from "../../lib/cloudinary";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";

const registerStudent = async (payload: ICreateStudentPayload) => {
  const department = await prisma.department.findUnique({
    where: { id: payload.departmentId },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  const program = await prisma.program.findUnique({
    where: { id: payload.programId },
  });

  if (!program) {
    throw new AppError(httpStatus.NOT_FOUND, "Program not found");
  }

  if (program.departmentId !== payload.departmentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Program does not belong to the specified department",
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists",
    );
  }

  // 2. Generate temp password and hash it
  const tempPassword = generateRandomPassword();
  const hashedPassword = await bcrypt.hash(
    tempPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: Role.STUDENT,
        authProvider: AuthProvider.CREDENTIALS,
        status: UserStatus.ACTIVE,
        needPasswordChange: true,
        emailVerified: false,
      },
      omit: {
        password: true,
      },
    });

    const studentId = await generateStudentId(
      tx,
      payload.departmentId,
      payload.admissionYear,
    );

    const studentProfile = await tx.studentProfile.create({
      data: {
        studentId,
        userId: user.id,
        departmentId: payload.departmentId,
        programId: payload.programId,
        admissionDate: payload.admissionDate,
        admissionYear: payload.admissionYear,
        gender: payload.gender,
        phone: payload.phone,
        address: payload.address,
        emergencyContactName: payload.emergencyContactName,
        emergencyContactPhone: payload.emergencyContactPhone,
      },
      include: {
        department: true,
        program: true,
      },
    });

    return { user, studentProfile };
  });

  // 4. Side effects AFTER commit — generate + send OTP
  const expirationSeconds = 5 * 60;
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpKey = `student-verification-otp:${result.user.email}`;

  await redisClient.set(otpKey, otp, {
    expiration: { type: "EX", value: expirationSeconds },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/student-welcome-otp.ejs",
  );
  const html = await ejs.renderFile(templatePath, {
    name: result.user.name,
    studentId: result.studentProfile.studentId,
    tempPassword,
    otp,
    expirationMinutes: expirationSeconds / 60,
  });

  await transporter.sendMail({
    from: config.smtp_user,
    to: result.user.email,
    subject: "Your student account has been created — verify your email",
    html,
  });

  return { user: result.user, studentProfile: result.studentProfile };
};

const getAllStudents = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "studentId",
    "admissionDate",
    "admissionYear",
    "createdAt",
    "updatedAt",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: StudentProfileWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          studentId: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          user: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
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
          program: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (query.departmentId) {
    andConditions.push({
      departmentId: query.departmentId,
    });
  }

  if (query.programId) {
    andConditions.push({
      programId: query.programId,
    });
  }

  if (query.admissionYear) {
    andConditions.push({
      admissionYear: Number(query.admissionYear),
    });
  }

  const students = await prisma.studentProfile.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      user: {
        omit: {
          password: true,
        },
      },

      department: true,

      program: true,
    },
  });

  const total = await prisma.studentProfile.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: students,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getStudentById = async (id: string) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      id,
    },

    include: {
      user: {
        omit: {
          password: true,
        },
      },

      department: true,

      program: true,
    },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, "Student not found");
  }

  return student;
};

const getMyStudentProfile = async (userId: string) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },

    include: {
      user: {
        omit: {
          password: true,
        },
      },

      department: true,

      program: true,
    },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, "Student profile not found");
  }

  return student;
};

const updateMyProfile = async (
  userId: string,
  payload: IUpdateStudentSelfPayload,
  profileImage: Express.Multer.File | null,
  additionalFiles: Express.Multer.File[],
) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },

    include: {
      user: true,
    },
  });

  if (!student) {
    throw new AppError(404, "Student profile not found");
  }

  if (student.user.isDeleted) {
    throw new AppError(403, "Account has been deleted");
  }

  if (student.user.status === UserStatus.SUSPENDED) {
    throw new AppError(403, "Account is suspended");
  }

  let profileImageResult: {
    secure_url: string;
    public_id: string;
  } | null = null;

  if (profileImage) {
    profileImageResult = await uploadToCloudinary(profileImage);
  }

  /*
   * ==========================================
   * Upload Additional Files
   * ==========================================
   *
   * StudentProfile currently does NOT have
   * an additionalFiles field.
   *
   * So do not upload additionalFiles unless
   * you add that field to StudentProfile.
   */

  if (additionalFiles.length > 0) {
    throw new AppError(
      400,
      "Additional files are not supported for student profile",
    );
  }

  /*
   * Database Update
   */

  const result = await prisma.$transaction(async (tx) => {
    /*
     * Update User
     */

    const user =
      payload.name !== undefined || profileImageResult !== null
        ? await tx.user.update({
            where: {
              id: userId,
            },

            data: {
              ...(payload.name !== undefined && {
                name: payload.name,
              }),

              ...(profileImageResult && {
                imageUrl: profileImageResult.secure_url,

                imagePublicId: profileImageResult.public_id,
              }),
            },

            omit: {
              password: true,
            },
          })
        : await tx.user.findUniqueOrThrow({
            where: {
              id: userId,
            },

            omit: {
              password: true,
            },
          });

    /*
     * Update Student Profile
     */

    const studentProfile = await tx.studentProfile.update({
      where: {
        userId,
      },

      data: {
        ...(payload.dateOfBirth !== undefined && {
          dateOfBirth: payload.dateOfBirth,
        }),

        ...(payload.gender !== undefined && {
          gender: payload.gender,
        }),

        ...(payload.phone !== undefined && {
          phone: payload.phone,
        }),

        ...(payload.address !== undefined && {
          address: payload.address,
        }),

        ...(payload.emergencyContactName !== undefined && {
          emergencyContactName: payload.emergencyContactName,
        }),

        ...(payload.emergencyContactPhone !== undefined && {
          emergencyContactPhone: payload.emergencyContactPhone,
        }),
      },

      include: {
        department: true,

        program: true,

        user: {
          omit: {
            password: true,
          },
        },
      },
    });

    return {
      user,
      studentProfile,
    };
  });

  /*
   * Delete Old Profile Image
   */
  if (profileImageResult && student.user.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(student.user.imagePublicId);
    } catch (error) {
      console.error("Failed to delete old profile image:", error);
    }
  }

  return result;
};

const updateStudentByAdmin = async (
  id: string,
  payload: IUpdateStudentAdminPayload,
) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      id,
    },

    include: {
      user: true,
    },
  });

  if (!student) {
    throw new AppError(404, "Student not found");
  }

  /*
   * Validate Department
   */

  if (payload.departmentId) {
    const department = await prisma.department.findUnique({
      where: {
        id: payload.departmentId,
      },
    });

    if (!department) {
      throw new AppError(404, "Department not found");
    }
  }

  /*
   * Validate Program
   */

  if (payload.programId || payload.departmentId) {
    const departmentId = payload.departmentId ?? student.departmentId;

    const programId = payload.programId ?? student.programId;

    const program = await prisma.program.findUnique({
      where: {
        id: programId,
      },
    });

    if (!program) {
      throw new AppError(404, "Program not found");
    }

    if (program.departmentId !== departmentId) {
      throw new AppError(
        400,
        "Program does not belong to the specified department",
      );
    }
  }

  /*
   * Database Update
   */

  const result = await prisma.$transaction(async (tx) => {
    /*
     * Update User
     */

    const user =
      payload.name !== undefined || payload.email !== undefined
        ? await tx.user.update({
            where: {
              id: student.userId,
            },

            data: {
              ...(payload.name !== undefined && {
                name: payload.name,
              }),

              ...(payload.email !== undefined && {
                email: payload.email,
              }),
            },

            omit: {
              password: true,
            },
          })
        : await tx.user.findUniqueOrThrow({
            where: {
              id: student.userId,
            },

            omit: {
              password: true,
            },
          });

    /*
     * Update Student Profile
     */

    const studentProfile = await tx.studentProfile.update({
      where: {
        id,
      },

      data: {
        ...(payload.departmentId !== undefined && {
          departmentId: payload.departmentId,
        }),

        ...(payload.programId !== undefined && {
          programId: payload.programId,
        }),

        ...(payload.admissionDate !== undefined && {
          admissionDate: payload.admissionDate,
        }),

        ...(payload.admissionYear !== undefined && {
          admissionYear: payload.admissionYear,
        }),

        ...(payload.currentSemesterNumber !== undefined && {
          currentSemesterNumber: payload.currentSemesterNumber,
        }),

        ...(payload.status !== undefined && {
          status: payload.status as any,
        }),

        ...(payload.academicStatus !== undefined && {
          academicStatus: payload.academicStatus as any,
        }),
      },

      include: {
        department: true,

        program: true,

        user: {
          omit: {
            password: true,
          },
        },
      },
    });

    return {
      user,
      studentProfile,
    };
  });

  return result;
};

const deleteStudent = async (id: string) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      id,
    },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, "Student not found");
  }

  const user = await prisma.user.update({
    where: {
      id: student.userId,
    },

    data: {
      isDeleted: true,
      status: UserStatus.INACTIVE,
      deletedAt: new Date(),
    },

    omit: {
      password: true,
    },
  });

  return user;
};

export const StudentService = {
  registerStudent,
  getAllStudents,
  getStudentById,
  getMyStudentProfile,
  updateMyProfile,
  updateStudentByAdmin,
  deleteStudent,
};
