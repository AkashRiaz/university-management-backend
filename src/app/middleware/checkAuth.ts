import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import { config } from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export interface RequestUser {
  email: string;
  name: string;
  userId: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

// auth(Role.ADMIN, Role.USER, Role.Author)
// auth() => ...requiredRoles => [Role.ADMIN, Role.USER, Role.AUTHOR]
export const auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization?.trim();
    const bearerToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : undefined;
    const cookieToken =
      typeof req.cookies.accessToken === "string"
        ? req.cookies.accessToken.trim()
        : undefined;
    const token = bearerToken || cookieToken;

    if (!token) {
      throw new AppError(
        401,
        "You are not logged in. Please log in to access this resource.",
      );
    }

    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verifiedToken.success) {
      throw new AppError(
        401,
        "Invalid or expired access token. Please log in again.",
      );
    }

    const { email, name, userId, role } = verifiedToken.data as JwtPayload;

    if (requiredRoles.length && !requiredRoles.includes(role)) {
      throw new Error(
        "Forbidden. You don't have permission to access this resource.",
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        email,
        name,
        role,
      },
    });

    if (!user) {
      throw new Error("User not found. Please log in again.");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new Error("Your account has been suspended. Please contact support.");
    }

    req.user = {
      email,
      name,
      userId,
      role,
    };

    next();
  });
};
