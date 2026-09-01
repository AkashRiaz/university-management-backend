import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { DepartmentService } from "./department.service";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";

const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  console.log("Payload received in createDepartment controller:", payload);
  const result = await DepartmentService.createDepartment(payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Department created successfully",
    data: result,
  });
});

export const DepartmentController = {
  createDepartment,
};
