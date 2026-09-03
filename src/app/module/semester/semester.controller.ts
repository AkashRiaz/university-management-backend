import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { SemesterService } from "./semester.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createSemester = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await SemesterService.createSemester(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Semester created successfully",
    data: result,
  });
});

const getAllSemesters = catchAsync(async (req: Request, res: Response) => {
  const result = await SemesterService.getAllSemesters();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Semesters retrieved successfully",
    data: result,
  });
});

const getSemesterById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await SemesterService.getSemesterById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Semester retrieved successfully",
    data: result,
  });
});

const getSemestersByAcademicYear = catchAsync(
  async (req: Request, res: Response) => {
    const { academicYearId } = req.params;

    const result = await SemesterService.getSemestersByAcademicYear(
      academicYearId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Semesters retrieved successfully",
      data: result,
    });
  },
);

const updateSemester = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await SemesterService.updateSemester(id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Semester updated successfully",
    data: result,
  });
});

const deleteSemester = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await SemesterService.deleteSemester(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Semester deleted successfully",
    data: null,
  });
});

export const SemesterController = {
  createSemester,
  getAllSemesters,
  getSemesterById,
  getSemestersByAcademicYear,
  updateSemester,
  deleteSemester,
};
