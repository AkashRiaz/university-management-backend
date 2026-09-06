import { AttendanceStatus } from "../../../generated/prisma/enums";

export interface ICreateAttendanceRecordPayload {
  sessionId: string;
  courseRegistrationId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface IUpdateAttendanceRecordPayload {
  status?: AttendanceStatus;
  remarks?: string;
}

export interface IBulkAttendanceRecord {
  courseRegistrationId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface IBulkAttendanceRecordPayload {
  sessionId: string;
  records: IBulkAttendanceRecord[];
}
