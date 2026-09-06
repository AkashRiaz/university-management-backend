import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { CourseRegistrationService } from "./courseRegistration.service";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";

const getAvailableCoursesForRegistration = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result =
      await CourseRegistrationService.getAvailableCoursesForRegistration(
        userId as string,
        req.params.registrationId as string,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Available courses retrieved successfully",
      data: result,
    });
  },
);

const createCourseRegistration = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await CourseRegistrationService.createCourseRegistration(
      userId as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Course registered successfully",
      data: result,
    });
  },
);

const getMyCourseRegistrations = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const registrationId = req.params.registrationId;
    const result = await CourseRegistrationService.getMyCourseRegistrations(
      userId as string,
      registrationId as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Course registrations retrieved successfully",
      data: result,
    });
  },
);

const getSingleCourseRegistration = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const courseRegistrationId = req.params.courseRegistrationId;
    const result = await CourseRegistrationService.getSingleCourseRegistration(
      userId as string,
      courseRegistrationId as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Course registration retrieved successfully",
      data: result,
    });
  },
);

const dropCourseRegistration = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const courseRegistrationId = req.params.courseRegistrationId;
    const result = await CourseRegistrationService.dropCourseRegistration(
      userId as string,
      courseRegistrationId as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Course dropped successfully",
      data: result,
    });
  },
);

export const CourseRegistrationController = {
  getAvailableCoursesForRegistration,
  createCourseRegistration,
  getMyCourseRegistrations,
  getSingleCourseRegistration,
  dropCourseRegistration,
};
