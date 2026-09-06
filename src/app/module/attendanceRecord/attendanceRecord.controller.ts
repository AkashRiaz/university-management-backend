import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AttendanceRecordService } from "./attendanceRecord.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createAttendanceRecord = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await AttendanceRecordService.createAttendanceRecord(
      userId as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Attendance record created successfully",
      data: result,
    });
  },
);

const createBulkAttendanceRecords = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AttendanceRecordService.createBulkAttendanceRecords(
      req.user?.userId as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Attendance records created successfully",
      data: result,
    });
  },
);

const getAttendanceRecordsBySession = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AttendanceRecordService.getAttendanceRecordsBySession(
      req.user?.userId as string,
      req.params.sessionId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Attendance records retrieved successfully",
      data: result,
    });
  },
);

const getStudentsForAttendance = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AttendanceRecordService.getStudentsForAttendance(
      req.user?.userId as string,
      req.params.sessionId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Students retrieved successfully",
      data: result,
    });
  },
);

const getAttendanceRecordById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AttendanceRecordService.getAttendanceRecordById(
      req.user?.userId as string,
      req.params.attendanceRecordId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Attendance record retrieved successfully",
      data: result,
    });
  },
);

const updateAttendanceRecord = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AttendanceRecordService.updateAttendanceRecord(
      req.user?.userId as string,
      req.params.attendanceRecordId as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Attendance record updated successfully",
      data: result,
    });
  },
);

const deleteAttendanceRecord = catchAsync(
  async (req: Request, res: Response) => {
    await AttendanceRecordService.deleteAttendanceRecord(
      req.user?.userId as string,
      req.params.attendanceRecordId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Attendance record deleted successfully",
      data: null,
    });
  },
);

const getStudentAttendance = catchAsync(async (req: Request, res: Response) => {
  const result = await AttendanceRecordService.getStudentAttendance(
    req.params.studentId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Student attendance retrieved successfully",
    data: result,
  });
});

export const AttendanceRecordController = {
  createAttendanceRecord,
  createBulkAttendanceRecords,
  getAttendanceRecordsBySession,
  getStudentsForAttendance,
  getAttendanceRecordById,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getStudentAttendance,
};
