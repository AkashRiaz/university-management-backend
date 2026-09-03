import { Request, Response } from "express";
import { CoursePrerequisiteService } from "./coursePrerequisite.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";

const createCoursePrerequisite = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CoursePrerequisiteService.createCoursePrerequisite(
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Course prerequisite created successfully",
      data: result,
    });
  },
);

const getAllCoursePrerequisites = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CoursePrerequisiteService.getAllCoursePrerequisites(
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Course prerequisites retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);

const getCoursePrerequisiteById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await CoursePrerequisiteService.getCoursePrerequisiteById(
      id as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Course prerequisite retrieved successfully",
      data: result,
    });
  },
);

const getPrerequisitesByCourse = catchAsync(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;

    const result = await CoursePrerequisiteService.getPrerequisitesByCourse(
      courseId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Course prerequisites retrieved successfully",
      data: result,
    });
  },
);

const getCoursesByPrerequisite = catchAsync(
  async (req: Request, res: Response) => {
    const { prerequisiteCourseId } = req.params;

    const result = await CoursePrerequisiteService.getCoursesByPrerequisite(
      prerequisiteCourseId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courses using this prerequisite retrieved successfully",
      data: result,
    });
  },
);

const updateCoursePrerequisite = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await CoursePrerequisiteService.updateCoursePrerequisite(
      id as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Course prerequisite updated successfully",
      data: result,
    });
  },
);

const deleteCoursePrerequisite = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    await CoursePrerequisiteService.deleteCoursePrerequisite(id as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Course prerequisite deleted successfully",
      data: null,
    });
  },
);

export const CoursePrerequisiteController = {
  createCoursePrerequisite,
  getAllCoursePrerequisites,
  getCoursePrerequisiteById,
  getPrerequisitesByCourse,
  getCoursesByPrerequisite,
  updateCoursePrerequisite,
  deleteCoursePrerequisite,
};
