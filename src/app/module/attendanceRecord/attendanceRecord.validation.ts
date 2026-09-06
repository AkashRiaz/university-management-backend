import z from "zod";
import { AttendanceStatus } from "../../../generated/prisma/enums";

export const createAttendanceRecordZodSchema = z.object({
  sessionId: z.uuid("Invalid session ID"),

  courseRegistrationId: z.uuid("Invalid course registration ID"),

  status: z.enum(AttendanceStatus, {
    error: "Invalid attendance status",
  }),

  remarks: z.string().trim().min(1, "Remarks cannot be empty").optional(),
});

export const updateAttendanceRecordZodSchema = z.object({
  status: z
    .enum(AttendanceStatus, {
      error: "Invalid attendance status",
    })
    .optional(),

  remarks: z.string().trim().min(1, "Remarks cannot be empty").optional(),
});

export const bulkAttendanceRecordZodSchema = z.object({
  sessionId: z.uuid("Invalid session ID"),

  records: z
    .array(
      z.object({
        courseRegistrationId: z.uuid("Invalid course registration ID"),

        status: z.enum(AttendanceStatus, {
          error: "Invalid attendance status",
        }),

        remarks: z.string().trim().min(1, "Remarks cannot be empty").optional(),
      }),
    )
    .min(1, "At least one attendance record is required"),
});
