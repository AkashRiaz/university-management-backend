import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { GradeScaleService } from "./gradeScale.service";
import httpStatus from "http-status";

const createGradeScale = catchAsync(async (req: Request, res: Response) => {
  const result = await GradeScaleService.createGradeScale(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Grade scale created successfully",
    data: result,
  });
});

const getAllGradeScales = catchAsync(async (req: Request, res: Response) => {
  const result = await GradeScaleService.getAllGradeScales();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Grade scales retrieved successfully",
    data: result,
  });
});

const getSingleGradeScale = catchAsync(async (req: Request, res: Response) => {
  const gradeScaleId = req.params.id;
  const result = await GradeScaleService.getSingleGradeScale(
    gradeScaleId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Grade scale retrieved successfully",
    data: result,
  });
});

const updateGradeScale = catchAsync(async (req: Request, res: Response) => {
  const result = await GradeScaleService.updateGradeScale(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Grade scale updated successfully",
    data: result,
  });
});

const deleteGradeScale = catchAsync(async (req: Request, res: Response) => {
  await GradeScaleService.deleteGradeScale(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Grade scale deleted successfully",
    data: null,
  });
});

export const GradeScaleController = {
  createGradeScale,
  getAllGradeScales,
  getSingleGradeScale,
  updateGradeScale,
  deleteGradeScale,
};
