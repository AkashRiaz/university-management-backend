import { Request, Response } from "express";

import httpStatus from "http-status";
import { FeeStructureService } from "./feeStructure.service";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";

const createFeeStructure = catchAsync(async (req: Request, res: Response) => {
  const result = await FeeStructureService.createFeeStructure(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Fee structure created successfully",
    data: result,
  });
});

const getAllFeeStructures = catchAsync(async (req: Request, res: Response) => {
  const result = await FeeStructureService.getAllFeeStructures(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fee structures retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getFeeStructureById = catchAsync(async (req: Request, res: Response) => {
  4;
  const id = req.params.id;
  const result = await FeeStructureService.getFeeStructureById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fee structure retrieved successfully",
    data: result,
  });
});

const getFeeStructuresByProgram = catchAsync(
  async (req: Request, res: Response) => {
    const programId = req.params.programId;
    const query = req.query;
    const result = await FeeStructureService.getFeeStructuresByProgram(
      programId as string,
      query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Fee structures retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getFeeStructuresBySemester = catchAsync(
  async (req: Request, res: Response) => {
    const semesterId = req.params.semesterId;
    const query = req.query;
    const result = await FeeStructureService.getFeeStructuresBySemester(
      semesterId as string,
      query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Fee structures retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const updateFeeStructure = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body;
  const result = await FeeStructureService.updateFeeStructure(
    id as string,
    payload,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fee structure updated successfully",
    data: result,
  });
});

const deleteFeeStructure = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await FeeStructureService.deleteFeeStructure(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fee structure deleted successfully",
    data: null,
  });
});

export const FeeStructureController = {
  createFeeStructure,
  getAllFeeStructures,
  getFeeStructureById,
  getFeeStructuresByProgram,
  getFeeStructuresBySemester,
  updateFeeStructure,
  deleteFeeStructure,
};
