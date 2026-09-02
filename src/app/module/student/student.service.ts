import { generateRandomPassword } from "../../helper/generateRandomPassword";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateStudentPayload } from "./student.interface";
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

const registerStudent = async (payload: ICreateStudentPayload) => {
  const department = await prisma.department.findUnique({
    where: { id: payload.departmentId },
    select: { code: true },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
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
        programId: "123",
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
  
};

export const StudentService = {
  registerStudent,
};
