import { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import { ICreateInstructorPayload } from "./instructor.interface";
import { InstructorService } from "./instructor.service";
import httpStatus from "http-status";

const createInstructor = async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await InstructorService.createInstructor(
    payload as ICreateInstructorPayload,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message:
      "Instructor created successfully. Verification OTP has been sent to the instructor's email.",
    data: result,
  });
};

const verifyInstructorEmail = async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } =
    await InstructorService.verifyInstructorEmail(req.body);

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
    statusCode: httpStatus.OK,
    success: true,
    message: "Instructor email verified successfully",
    data: {
      accessToken,
      refreshToken,
      user,
    },
  });
};

const resendInstructorVerificationOtp = async (req: Request, res: Response) => {
  const result = await InstructorService.resendInstructorVerificationOtp(
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Instructor verification OTP sent successfully",
    data: result,
  });
};

const getAllInstructors = async (req: Request, res: Response) => {
  const query = req.query;
  const result = await InstructorService.getAllInstructors(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Instructors retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
};

const getInstructorById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await InstructorService.getInstructorById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Instructor retrieved successfully",
    data: result,
  });
};

const updateMyProfile = async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: string };
  console.log(req.files);
  const files = req.files as {
    profileImage?: Express.Multer.File[];

    additionalFiles?: Express.Multer.File[];
  };

  const profileImage = files?.profileImage?.[0] ?? null;

  const additionalFiles = files?.additionalFiles ?? [];

  const result = await InstructorService.updateMyProfile(
    userId as string,
    req.body,
    profileImage,
    additionalFiles,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your instructor profile updated successfully",
    data: result,
  });
};

const updateInstructorByAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await InstructorService.updateInstructorByAdmin(
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Instructor updated successfully",
    data: result,
  });
};

const deleteInstructor = async (req: Request, res: Response) => {
  const result = await InstructorService.deleteInstructor(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Instructor deleted successfully",
    data: result,
  });
};

export const InstructorController = {
  createInstructor,
  verifyInstructorEmail,
  resendInstructorVerificationOtp,
  getAllInstructors,
  getInstructorById,
  updateMyProfile,
  updateInstructorByAdmin,
  deleteInstructor,
};
