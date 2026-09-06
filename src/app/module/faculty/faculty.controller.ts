import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { facultyService } from "./faculty.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createFaculty = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await facultyService.createFaculty(payload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Faculty created successfully",
    data: result,
  });
});

const getAllFaculties = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await facultyService.getAllFaculties(query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Faculties retrieved successfully",
    data: result,
  });
});

const getFacultyById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await facultyService.getFacultyById(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Faculty retrieved successfully",
    data: result,
  });
});

const updateFaculty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const payload = req.body;

  const result = await facultyService.updateFaculty(id as string, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Faculty updated successfully",
    data: result,
  });
});

const deleteFaculty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await facultyService.deleteFaculty(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Faculty deleted successfully",
    data: result,
  });
});

export const facultyController = {
  createFaculty,
  getAllFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
};
