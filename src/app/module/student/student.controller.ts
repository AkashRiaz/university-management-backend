import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { StudentService } from "./student.service";
import { sendResponse } from "../../utils/sendResponse";

const registerStudent = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await StudentService.registerStudent(payload);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Student registered successfully",
    data: result,
  });
});

export const StudentController = {
  registerStudent,
};
