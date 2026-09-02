import { Role, UserStatus } from "../../../generated/prisma/enums";
import { config } from "../../config";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";
import { jwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";
import { hashToken } from "../../utils/hashToken";
import { IGoogleLoginPayload } from "./auth.interface";
import { TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";
import path from "path";
import ejs from "ejs";
import { transporter } from "../../lib/nodemailer";

const verifyStudentEmail = async (payload: any) => {
  const { email, otp } = payload;
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
  }

  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "User is deleted");
  }

  if (user.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified");
  }

  const otpKey = `student-verification-otp:${user.email}`;
  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired or is invalid");
  }
  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  await redisClient.del([otpKey]);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
    omit: { password: true },
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

  // Hash refresh token
  const refreshTokenHash = hashToken(refreshToken);

  // Refresh token expiration
  const refreshTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  // Save refresh token
  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      userId: updatedUser.id,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return { user: updatedUser, accessToken, refreshToken };
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token is required");
  }

  // 1. Verify JWT
  const verifiedToken = jwtUtils.verifyToken(token, config.jwt_refresh_secret);

  if (!verifiedToken.success) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  // 2. Hash the raw refresh token
  const tokenHash = hashToken(token);

  // 3. Find hashed token in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: true,
    },
  });

  if (!storedToken) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token not found");
  }
  // 4. Check revoked
  if (storedToken.revokedAt) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Refresh token has been revoked",
    );
  }

  // 5. Check database expiration
  if (storedToken.expiresAt <= new Date()) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token has expired");
  }

  const user = storedToken.user;

  // 6. Check user
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "User account has been deleted");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "User account is suspended");
  }

  // 7. Create new JWT payload
  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // 8. Create new access token
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  // 9. Create new refresh token
  const newRefreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  // 10. Hash new refresh token
  const newRefreshTokenHash = hashToken(newRefreshToken);

  // 11. Revoke old refresh token
  await prisma.refreshToken.update({
    where: {
      id: storedToken.id,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  // 12. Store new refresh token
  await prisma.refreshToken.create({
    data: {
      tokenHash: newRefreshTokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

const googleLoginForStudent = async (payload: IGoogleLoginPayload) => {
  let googleIdTokenPayload: TokenPayload | null | undefined = null;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });
    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      config.node_env === "development"
        ? `Google login failed: ${error}`
        : "Google login failed",
    );
  }

  if (!googleIdTokenPayload?.email) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Unable to retrieve email from Google",
    );
  }

  if (!googleIdTokenPayload.name) {
    throw new Error(
      "Google login failed: Unable to retrieve user name from Google",
    );
  }

  const email = googleIdTokenPayload.email.trim().toLowerCase();

  // 2. Fast path — already linked before
  let user = await prisma.user.findUnique({
    where: { email, role: Role.STUDENT, googleId: googleIdTokenPayload.sub },
  });

  let isFirstTimeLink = false;

  if (!user) {
    // 3. Not linked yet — must already exist (admin-created), never auto-create
    const existingStudent = await prisma.user.findUnique({
      where: { email, role: Role.STUDENT },
    });

    if (!existingStudent) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "No student record found for this email. Contact the admission office.",
      );
    }

    if (
      existingStudent.googleId &&
      existingStudent.googleId !== googleIdTokenPayload.sub
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This account is linked to a different Google account",
      );
    }

    if (existingStudent.status === UserStatus.SUSPENDED) {
      throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
    }

    if (existingStudent.isDeleted) {
      throw new AppError(httpStatus.FORBIDDEN, "User is deleted");
    }

    // 4. Link Google + verify email in one update
    user = await prisma.user.update({
      where: { id: existingStudent.id },
      data: {
        googleId: googleIdTokenPayload.sub,
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    });

    isFirstTimeLink = true;
  } else {
    // Already-linked returning user — just update lastLoginAt
    user = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  }

  // 5. Final safety checks (covers both branches above)
  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
  }
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "User is deleted");
  }

  // 6. Generate tokens (inline, matching your existing pattern)
  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
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

  // 7. Store refresh token hash in DB (RefreshToken table)
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // match jwt_refresh_expires_in

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  const student = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      department: true,
      program: true,
    },
  });

  // 8. Send welcome email — only on first-time Google link, not every login
  if (isFirstTimeLink) {
    const templatePath = path.join(
      process.cwd(),
      "src/app/templates/student-welcome-email.ejs",
    );

    const html = await ejs.renderFile(templatePath, {
      name: user.name,
      email: user.email,
      studentId: student?.studentId,
      departmentName: student?.department?.name,
      programName: student?.program?.name,
    });

    await transporter.sendMail({
      from: config.smtp_user,
      to: user.email,
      subject: "Welcome — Your account is now active",
      html,
    });
  }

  const { password: _password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

const logout = async (token: string) => {
  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token is required");
  }

  const tokenHash = hashToken(token);

  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
  });

  if (storedToken && !storedToken.revokedAt) {
    await prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
};

export const AuthService = {
  verifyStudentEmail,
  refreshToken,
  logout,
  googleLoginForStudent,
};
