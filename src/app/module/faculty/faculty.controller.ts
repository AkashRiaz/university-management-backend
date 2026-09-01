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

export const facultyController = {
  createFaculty,
};
