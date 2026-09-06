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

const getAllDepartments = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await DepartmentService.getAllDepartments(query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Departments retrieved successfully",
    data: result,
  });
});

const getDepartmentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await DepartmentService.getDepartmentById(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Department retrieved successfully",
    data: result,
  });
});

const updateDepartment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const payload = req.body;

  const result = await DepartmentService.updateDepartment(
    id as string,
    payload,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Department updated successfully",
    data: result,
  });
});

const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await DepartmentService.deleteDepartment(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Department deleted successfully",
    data: result,
  });
});

export const DepartmentController = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
