import { Request, Response } from "express";

import httpStatus from "http-status";
import { ClassScheduleService } from "./classSchedule.service";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";

const createClassSchedule = catchAsync(async (req: Request, res: Response) => {
  const result = await ClassScheduleService.createClassSchedule(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Class schedule created successfully",
    data: result,
  });
});

const getAllClassSchedules = catchAsync(async (req: Request, res: Response) => {
  const result = await ClassScheduleService.getAllClassSchedules(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,

    success: true,

    message: "Class schedules retrieved successfully",

    data: result.data,

    meta: result.meta,
  });
});

const getClassScheduleById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ClassScheduleService.getClassScheduleById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,

    success: true,

    message: "Class schedule retrieved successfully",

    data: result,
  });
});

const getClassSchedulesBySection = catchAsync(
  async (req: Request, res: Response) => {
    const { sectionId } = req.params;

    const result = await ClassScheduleService.getClassSchedulesBySection(
      sectionId as string,
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,

      success: true,

      message: "Class schedules retrieved successfully",

      data: result.data,

      meta: result.meta,
    });
  },
);

const getClassSchedulesByDepartment = catchAsync(
  async (req: Request, res: Response) => {
    const { departmentId } = req.params;

    const result = await ClassScheduleService.getClassSchedulesByDepartment(
      departmentId as string,
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,

      success: true,

      message: "Class schedules retrieved successfully",

      data: result.data,

      meta: result.meta,
    });
  },
);

const updateClassSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ClassScheduleService.updateClassSchedule(
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,

    success: true,

    message: "Class schedule updated successfully",

    data: result,
  });
});

const deleteClassSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await ClassScheduleService.deleteClassSchedule(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,

    success: true,

    message: "Class schedule deleted successfully",

    data: null,
  });
});

export const ClassScheduleController = {
  createClassSchedule,
  getAllClassSchedules,
  getClassScheduleById,
  getClassSchedulesBySection,
  getClassSchedulesByDepartment,
  updateClassSchedule,
  deleteClassSchedule,
};
