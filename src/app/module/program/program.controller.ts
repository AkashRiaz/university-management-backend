import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { ProgramService } from "./program.service";

const createProgram = catchAsync(async (req: Request, res: Response) => {
  const program = await ProgramService.createProgram(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Program created successfully",
    data: program,
  });
});

const getAllPrograms = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const { data, meta } = await ProgramService.getAllPrograms(query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Programs retrieved successfully",
    data,
    meta,
  });
});

const getProgramsByDepartment = catchAsync(
  async (req: Request, res: Response) => {
    const { departmentId } = req.params;

    const result = await ProgramService.getProgramsByDepartment(
      departmentId as string,
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Programs retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getProgramById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProgramService.getProgramById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Program retrieved successfully",
    data: result,
  });
});

const updateProgram = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ProgramService.updateProgram(id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Program updated successfully",
    data: result,
  });
});

const deleteProgram = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ProgramService.deleteProgram(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Program deleted successfully",
    data: result,
  });
});
export const ProgramController = {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  getProgramsByDepartment,
  deleteProgram,
};
