import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AcademicYearService } from "./academicYear.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createAcademicYear = catchAsync(async (req: Request, res: Response) => {
  const result = await AcademicYearService.createAcademicYear(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Academic year created successfully",
    data: result,
  });
});

const getAllAcademicYears = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await AcademicYearService.getAllAcademicYears(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Academic years retrieved successfully",
    data: result,
  });
});

const getAcademicYearById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await AcademicYearService.getAcademicYearById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Academic year retrieved successfully",
    data: result,
  });
});

const updateAcademicYear = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await AcademicYearService.updateAcademicYear(
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Academic year updated successfully",
    data: result,
  });
});

const deleteAcademicYear = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await AcademicYearService.deleteAcademicYear(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Academic year deleted successfully",
    data: null,
  });
});

export const AcademicYearController = {
  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
};
