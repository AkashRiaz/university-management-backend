import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { StudentService } from "./student.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const registerStudent = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await StudentService.registerStudent(payload);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Student registered successfully and verification email sent to student's email address",
    data: result,
  });
});

const getAllStudents = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await StudentService.getAllStudents(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Students retrieved successfully",
    data: result,
  });
});

const getStudentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await StudentService.getStudentById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student retrieved successfully",
    data: result,
  });
});



const getMyStudentProfile = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as {
    userId: string;
  };

  const result = await StudentService.getMyStudentProfile(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your student profile retrieved successfully",
    data: result,
  });
});


const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as {
    userId: string;
  };

  const files = req.files as {
    profileImage?: Express.Multer.File[];

    additionalFiles?: Express.Multer.File[];
  };

  const profileImage = files?.profileImage?.[0] ?? null;

  const additionalFiles = files?.additionalFiles ?? [];

  const result = await StudentService.updateMyProfile(
    userId,
    req.body,
    profileImage,
    additionalFiles,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your student profile updated successfully",
    data: result,
  });
});



const updateStudentByAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await StudentService.updateStudentByAdmin(
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student updated successfully",
    data: result,
  });
});

const deleteStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await StudentService.deleteStudent(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student deleted successfully",
    data: result,
  });
});

export const StudentController = {
  registerStudent,
  getAllStudents,
  getStudentById,
  getMyStudentProfile,
  updateMyProfile,
  updateStudentByAdmin,
  deleteStudent,
};
