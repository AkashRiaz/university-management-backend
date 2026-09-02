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
import { redisClient } from "../../lib/redis";
import path from "path";
import ejs from "ejs";
import { transporter } from "../../lib/nodemailer";

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

export const StudentService = {
  registerStudent,
};
