import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { GradeService } from "./grade.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createGrade = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await GradeService.createGrade(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Grade created successfully",
    data: result,
  });
});

const getGradesByGradeScale = catchAsync(
  async (req: Request, res: Response) => {
    const gradeScaleId = req.params.gradeScaleId;
    const result = await GradeService.getGradesByGradeScale(
      gradeScaleId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Grades retrieved successfully",
      data: result,
    });
  },
);

const getSingleGrade = catchAsync(async (req: Request, res: Response) => {
  const result = await GradeService.getSingleGrade(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Grade retrieved successfully",
    data: result,
  });
});

const updateGrade = catchAsync(async (req: Request, res: Response) => {
  const result = await GradeService.updateGrade(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Grade updated successfully",
    data: result,
  });
});

const deleteGrade = catchAsync(async (req: Request, res: Response) => {
  await GradeService.deleteGrade(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Grade deleted successfully",
    data: null,
  });
});

export const GradeController = {
  createGrade,
  getGradesByGradeScale,
  getSingleGrade,
  updateGrade,
  deleteGrade,
};
