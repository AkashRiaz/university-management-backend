import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AttendanceSessionService } from "./attendanceSession.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createAttendanceSession = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await AttendanceSessionService.createAttendanceSession(
      userId as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Attendance session created successfully",
      data: result,
    });
  },
);

const getAttendanceSessionsBySection = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result =
      await AttendanceSessionService.getAttendanceSessionsBySection(
        userId as string,
        req.params.sectionId as string,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Attendance sessions retrieved successfully",
      data: result,
    });
  },
);

const getSingleAttendanceSession = catchAsync(
  async (req: Request, res: Response) => {
    const { attendanceSessionId } = req.params;
    const userId = req.user?.userId;

    const result = await AttendanceSessionService.getAttendanceSessionById(
      userId as string,
      attendanceSessionId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Attendance session retrieved successfully",
      data: result,
    });
  },
);

const updateAttendanceSession = catchAsync(
  async (req: Request, res: Response) => {
    const { attendanceSessionId } = req.params;

    const result = await AttendanceSessionService.updateAttendanceSession(
      attendanceSessionId as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Attendance session updated successfully",
      data: result,
    });
  },
);

const deleteAttendanceSession = catchAsync(
  async (req: Request, res: Response) => {
    const { attendanceSessionId } = req.params;

    await AttendanceSessionService.deleteAttendanceSession(
      attendanceSessionId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Attendance session deleted successfully",
      data: null,
    });
  },
);

export const AttendanceSessionController = {
  createAttendanceSession,
  getAttendanceSessionsBySection,
  getSingleAttendanceSession,
  updateAttendanceSession,
  deleteAttendanceSession,
};
