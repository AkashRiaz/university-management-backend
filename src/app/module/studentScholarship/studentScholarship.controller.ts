import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { StudentScholarshipService } from "./studentScholarship.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createStudentScholarship = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StudentScholarshipService.createStudentScholarship(
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Student scholarship created successfully",
      data: result,
    });
  },
);

const getAllStudentScholarships = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StudentScholarshipService.getAllStudentScholarships(
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Student scholarships retrieved successfully",

      meta: result.meta,

      data: result.data,
    });
  },
);

const getSingleStudentScholarship = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await StudentScholarshipService.getSingleStudentScholarship(
      id as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Student scholarship retrieved successfully",

      data: result,
    });
  },
);

const updateStudentScholarship = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const id = req.params.id;
    const result = await StudentScholarshipService.updateStudentScholarship(
      id as string,
      payload,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Student scholarship updated successfully",

      data: result,
    });
  },
);

const deleteStudentScholarship = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    await StudentScholarshipService.deleteStudentScholarship(id as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Student scholarship deleted successfully",

      data: null,
    });
  },
);

export const StudentScholarshipController = {
  createStudentScholarship,
  getAllStudentScholarships,
  getSingleStudentScholarship,
  updateStudentScholarship,
  deleteStudentScholarship,
};
