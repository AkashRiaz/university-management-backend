import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ScholarshipService } from "./scholarship.service";
import httpStatus from "http-status";

const createScholarship = catchAsync(async (req: Request, res: Response) => {
  const result = await ScholarshipService.createScholarship(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Scholarship created successfully",
    data: result,
  });
});

const getAllScholarships = catchAsync(async (req: Request, res: Response) => {
  const result = await ScholarshipService.getAllScholarships(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Scholarships retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleScholarship = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ScholarshipService.getSingleScholarship(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Scholarship retrieved successfully",
    data: result,
  });
});

const updateScholarship = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const id = req.params.id;
  const result = await ScholarshipService.updateScholarship(
    id as string,
    payload,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Scholarship updated successfully",
    data: result,
  });
});

const deleteScholarship = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await ScholarshipService.deleteScholarship(id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Scholarship deleted successfully",
    data: null,
  });
});

export const ScholarshipController = {
  createScholarship,
  getAllScholarships,
  getSingleScholarship,
  updateScholarship,
  deleteScholarship,
};
