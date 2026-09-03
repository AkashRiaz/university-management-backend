import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateInstructorPayload,
  IResendInstructorOtpPayload,
  IUpdateInstructorAdminPayload,
  IUpdateInstructorSelfPayload,
  IVerifyInstructorEmailPayload,
} from "./instructor.interface";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { generateRandomPassword } from "../../helper/generateRandomPassword";
import { config } from "../../config";
import path from "path";
import ejs from "ejs";
import {
  AuthProvider,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import { generateEmployeeId } from "./instructor.utils";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import { hashToken } from "../../utils/hashToken";
import { jwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";
import { IQuery } from "../../interfaces";
import { InstructorProfileWhereInput } from "../../../generated/prisma/models";
import { cloudinary } from "../../lib/cloudinary";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";

const createInstructor = async (payload: ICreateInstructorPayload) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists",
    );
  }

  const department = await prisma.department.findUnique({
    where: {
      id: payload.departmentId,
    },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

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

        role: Role.INSTRUCTOR,

        authProvider: AuthProvider.CREDENTIALS,

        status: UserStatus.ACTIVE,

        needPasswordChange: true,

        emailVerified: false,
      },

      omit: {
        password: true,
      },
    });

    const employeeId = await generateEmployeeId(
      tx,
      payload.departmentId,
      new Date().getFullYear(),
    );

    const instructorProfile = await tx.instructorProfile.create({
      data: {
        employeeId,

        userId: user.id,

        designation: payload.designation,

        specialization: payload.specialization,

        phone: payload.phone,

        officeRoom: payload.officeRoom,

        joiningDate: payload.joiningDate,

        dateOfBirth: payload.dateOfBirth,

        gender: payload.gender,

        address: payload.address,

        bio: payload.bio,

        qualification: payload.qualification,

        departmentId: payload.departmentId,
      },

      include: {
        department: true,

        user: {
          omit: {
            password: true,
          },
        },
      },
    });

    return {
      user,
      instructorProfile,
    };
  });

  /*
   * Generate verification OTP
   * AFTER transaction succeeds.
   */

  const expirationSeconds = 60 * 60;

  const otp = crypto.randomInt(100000, 999999).toString();

  const otpKey = `instructor-verification-otp:${result.user.email}`;

  await redisClient.set(otpKey, otp, {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/instructor-welcome-otp.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    name: result.user.name,

    email: result.user.email,

    employeeId: result.instructorProfile.employeeId,

    designation: result.instructorProfile.designation,

    department: result.instructorProfile.department.name,

    tempPassword,

    otp,

    expirationMinutes: expirationSeconds / 60,
  });

  /*
   * Send email.
   */

  await transporter.sendMail({
    from: config.smtp_user,

    to: result.user.email,

    subject: "Your instructor account has been created — verify your email",

    html,
  });

  return {
    user: result.user,

    instructorProfile: result.instructorProfile,
  };
};

const verifyInstructorEmail = async (
  payload: IVerifyInstructorEmailPayload,
) => {
  const { email, otp } = payload;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.role !== Role.INSTRUCTOR) {
    throw new AppError(403, "This account is not an instructor account");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(403, "User is suspended");
  }

  if (user.isDeleted) {
    throw new AppError(403, "User is deleted");
  }

  if (user.emailVerified) {
    throw new AppError(400, "Email is already verified");
  }

  const otpKey = `instructor-verification-otp:${user.email}`;

  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new AppError(400, "OTP has expired or is invalid");
  }

  if (redisOtp !== otp) {
    throw new AppError(400, "Invalid OTP");
  }

  await redisClient.del([otpKey]);

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      emailVerified: true,
    },
    omit: {
      password: true,
    },
  });

  const jwtPayload = {
    userId: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  const refreshTokenHash = hashToken(refreshToken);

  const refreshTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      userId: updatedUser.id,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return {
    user: updatedUser,
    accessToken,
    refreshToken,
  };
};

const resendInstructorVerificationOtp = async (
  payload: IResendInstructorOtpPayload,
) => {
  const { email } = payload;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },

    include: {
      instructor: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== Role.INSTRUCTOR) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This account is not an instructor account",
    );
  }

  if (!user.instructor) {
    throw new AppError(httpStatus.NOT_FOUND, "Instructor profile not found");
  }

  if (user.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
  }

  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "User is deleted");
  }

  const expirationSeconds = 5 * 60;

  const otp = crypto.randomInt(100000, 999999).toString();

  const otpKey = `instructor-verification-otp:${user.email}`;

  await redisClient.set(otpKey, otp, {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/instructor-welcome-otp.ejs",
  );

  /*
   * Important:
   * We don't have the original temporary
   * password anymore.
   *
   * Therefore resend email should not send
   * another temporary password.
   */

  const html = await ejs.renderFile(templatePath, {
    name: user.name,

    email: user.email,

    employeeId: user.instructor.employeeId,

    designation: user.instructor.designation,

    department: user.instructor.department.name,

    tempPassword: "Use your previously provided temporary password",

    otp,

    expirationMinutes: expirationSeconds / 60,
  });

  await transporter.sendMail({
    from: config.smtp_user,
    to: user.email,
    subject: "Your instructor email verification OTP",
    html,
  });

  return {
    message: "Verification OTP sent successfully",
  };
};

const getAllInstructors = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: InstructorProfileWhereInput[] = [
    {
      user: {
        isDeleted: false,
      },
    },
  ];

  // Search by name or email
  if (query.searchTerm) {
    andConditions.push({
      OR: [
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
          employeeId: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // Filter by department
  if (query.departmentId) {
    andConditions.push({
      departmentId: query.departmentId,
    });
  }

  // Filter by designation
  if (query.designation) {
    andConditions.push({
      designation: query.designation,
    });
  }

  const instructors = await prisma.instructorProfile.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    include: {
      user: {
        omit: {
          password: true,
        },
      },

      department: true,
    },

    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.instructorProfile.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: instructors,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getInstructorById = async (id: string) => {
  const instructor = await prisma.instructorProfile.findUnique({
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

      sections: {
        include: {
          section: true,
        },
      },
    },
  });

  if (!instructor) {
    throw new AppError(404, "Instructor not found");
  }

  return instructor;
};

const updateMyProfile = async (
  userId: string,

  payload: IUpdateInstructorSelfPayload,

  profileImage: Express.Multer.File | null,

  additionalFiles: Express.Multer.File[],
) => {
  const instructor = await prisma.instructorProfile.findUnique({
    where: {
      userId,
    },

    include: {
      user: true,
    },
  });

  if (!instructor) {
    throw new AppError(404, "Instructor profile not found");
  }

  if (instructor.user.isDeleted) {
    throw new AppError(403, "Account has been deleted");
  }

  if (instructor.user.status === UserStatus.SUSPENDED) {
    throw new AppError(403, "Account is suspended");
  }

  /*
   * ==========================================
   * Upload Profile Image
   * ==========================================
   */

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
   */

  const additionalFilesResults = await Promise.all(
    additionalFiles.map(async (file) => {
      const result = await uploadToCloudinary(file);

      return {
        secure_url: result.secure_url,

        public_id: result.public_id,

        fileName: file.originalname,

        mimeType: file.mimetype,

        size: file.size,
      };
    }),
  );

  /*
   * ==========================================
   * Existing Additional Files
   * ==========================================
   */

  const existingAdditionalFiles = Array.isArray(instructor.additionalFiles)
    ? instructor.additionalFiles
    : [];

  /*
   * ==========================================
   * Database Update
   * ==========================================
   */

  const result = await prisma.$transaction(async (tx) => {
    /*
     * --------------------------------------
     * Update User
     * --------------------------------------
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
     * --------------------------------------
     * Update Instructor Profile
     * --------------------------------------
     */

    const instructorProfile = await tx.instructorProfile.update({
      where: {
        userId,
      },

      data: {
        ...(payload.specialization !== undefined && {
          specialization: payload.specialization,
        }),

        ...(payload.phone !== undefined && {
          phone: payload.phone,
        }),

        ...(payload.officeRoom !== undefined && {
          officeRoom: payload.officeRoom,
        }),

        ...(payload.dateOfBirth !== undefined && {
          dateOfBirth: payload.dateOfBirth,
        }),

        ...(payload.gender !== undefined && {
          gender: payload.gender,
        }),

        ...(payload.address !== undefined && {
          address: payload.address,
        }),

        ...(payload.bio !== undefined && {
          bio: payload.bio,
        }),

        ...(payload.qualification !== undefined && {
          qualification: payload.qualification,
        }),

        ...(additionalFilesResults.length > 0 && {
          additionalFiles: [
            ...existingAdditionalFiles,
            ...additionalFilesResults,
          ],
        }),
      },

      include: {
        department: true,

        user: {
          omit: {
            password: true,
          },
        },
      },
    });

    return {
      user,
      instructorProfile,
    };
  });

  /*
   * ==========================================
   * Delete Old Profile Image
   * ==========================================
   */

  if (profileImageResult && instructor.user.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(instructor.user.imagePublicId);
    } catch (error) {
      console.error("Failed to delete old profile image:", error);
    }
  }

  return result;
};

const updateInstructorByAdmin = async (
  id: string,
  payload: IUpdateInstructorAdminPayload,
) => {
  const instructor = await prisma.instructorProfile.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
    },
  });

  if (!instructor) {
    throw new AppError(404, "Instructor not found");
  }

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

  const result = await prisma.$transaction(async (tx) => {
    const user =
      payload.name !== undefined || payload.status !== undefined
        ? await tx.user.update({
            where: {
              id: instructor.userId,
            },

            data: {
              ...(payload.name !== undefined && {
                name: payload.name,
              }),

              ...(payload.status !== undefined && {
                status: payload.status,
              }),
            },

            omit: {
              password: true,
            },
          })
        : await tx.user.findUniqueOrThrow({
            where: {
              id: instructor.userId,
            },

            omit: {
              password: true,
            },
          });

    const instructorProfile = await tx.instructorProfile.update({
      where: {
        id,
      },

      data: {
        ...(payload.designation !== undefined && {
          designation: payload.designation,
        }),

        ...(payload.joiningDate !== undefined && {
          joiningDate: payload.joiningDate,
        }),

        ...(payload.departmentId !== undefined && {
          departmentId: payload.departmentId,
        }),
      },

      include: {
        department: true,

        user: {
          omit: {
            password: true,
          },
        },
      },
    });

    return {
      user,
      instructorProfile,
    };
  });

  return result;
};

const deleteInstructor = async (id: string) => {
  const instructor = await prisma.instructorProfile.findUnique({
    where: {
      id,
    },
  });

  if (!instructor) {
    throw new AppError(404, "Instructor not found");
  }

  await prisma.user.update({
    where: {
      id: instructor.userId,
    },

    data: {
      isDeleted: true,

      deletedAt: new Date(),
    },
  });

  return {
    message: "Instructor deleted successfully",
  };
};

export const InstructorService = {
  createInstructor,
  verifyInstructorEmail,
  resendInstructorVerificationOtp,
  getAllInstructors,
  getInstructorById,
  updateMyProfile,
  updateInstructorByAdmin,
  deleteInstructor,
};
