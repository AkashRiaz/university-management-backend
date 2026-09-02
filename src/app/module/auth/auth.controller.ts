import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AuthService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const verifyStudentEmail = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const { user, accessToken, refreshToken } =
    await AuthService.verifyStudentEmail(payload);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Email Verified Successfully",
    data: {
      accessToken,
      refreshToken,
      user,
    },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await AuthService.loginUser(
    req.body,
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully",
    data: {
      accessToken,
      refreshToken,
      user,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  if (!req.cookies.refreshToken) {
    throw new Error("Refresh token is missing");
  }
  const result = await AuthService.refreshToken(req.cookies.refreshToken);
  const { accessToken, refreshToken: newRefreshToken } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New tokens generated successfully",
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

const googleLoginForStudent = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;

    const { user, accessToken, refreshToken } =
      await AuthService.googleLoginForStudent(payload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Logged in with Google successfully",
      data: {
        accessToken,
        refreshToken,
        user,
      },
    });
  },
);

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  await AuthService.forgotPassword(payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset email sent successfully",
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  await AuthService.resetPassword(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: null,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  await AuthService.logout(token);

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logout successful",
    data: null,
  });
});

export const AuthController = {
  verifyStudentEmail,
  refreshToken,
  logout,
  googleLoginForStudent,
  forgotPassword,
  resetPassword,
  loginUser,
};
