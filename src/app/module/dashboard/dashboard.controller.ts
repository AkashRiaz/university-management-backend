import httpStatus from "http-status";
import { DashboardService } from "./dashboard.service";
import { catchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";

const getAdminOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getAdminOverview();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin dashboard overview retrieved successfully",
    data: result,
  });
});

const getStudentOverview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  console.log("User ID:", userId);

  const result = await DashboardService.getStudentOverview(userId);
  console.log("Student Overview Result:", result);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student dashboard overview retrieved successfully",
    data: result,
  });
});

export const DashboardController = {
  getAdminOverview,
  getStudentOverview,
};
