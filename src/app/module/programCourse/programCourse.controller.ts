import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { ProgramCourseService } from "./programCourse.service";
import { sendResponse } from "../../utils/sendResponse";

const createProgramCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await ProgramCourseService.createProgramCourse(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Course assigned to program successfully",
    data: result,
  });
});

const getAllProgramCourses = catchAsync(async (req: Request, res: Response) => {
  const result = await ProgramCourseService.getAllProgramCourses(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Program courses retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getProgramCourseById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ProgramCourseService.getProgramCourseById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Program course retrieved successfully",
    data: result,
  });
});

const getCoursesByProgram = catchAsync(async (req: Request, res: Response) => {
  const { programId } = req.params;

  const result = await ProgramCourseService.getCoursesByProgram(
    programId as string,
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Program courses retrieved successfully",
    data: result,
  });
});

const getProgramsByCourse = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;

  const result = await ProgramCourseService.getProgramsByCourse(
    courseId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Programs for course retrieved successfully",
    data: result,
  });
});

const updateProgramCourse = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ProgramCourseService.updateProgramCourse(
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Program course updated successfully",
    data: result,
  });
});

const deleteProgramCourse = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await ProgramCourseService.deleteProgramCourse(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Program course deleted successfully",
    data: null,
  });
});

export const ProgramCourseController = {
  createProgramCourse,
  getAllProgramCourses,
  getProgramCourseById,
  getCoursesByProgram,
  getProgramsByCourse,
  updateProgramCourse,
  deleteProgramCourse,
};
