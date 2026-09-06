import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { bulkAttendanceRecordZodSchema, createAttendanceRecordZodSchema, updateAttendanceRecordZodSchema } from "./attendanceRecord.validation";
import { AttendanceRecordController } from "./attendanceRecord.controller";

const router = Router();

router.post(
  "/",
  auth(Role.INSTRUCTOR),
  validateRequest(createAttendanceRecordZodSchema),
  AttendanceRecordController.createAttendanceRecord,
);


router.post(
  "/bulk",
  auth(Role.INSTRUCTOR),
  validateRequest(
    bulkAttendanceRecordZodSchema,
  ),
  AttendanceRecordController
    .createBulkAttendanceRecords,
);

router.get(
  "/session/:sessionId/students",
  auth(Role.INSTRUCTOR),
  AttendanceRecordController
    .getStudentsForAttendance,
);

router.get(
  "/session/:sessionId",
  auth(Role.INSTRUCTOR),
  AttendanceRecordController
    .getAttendanceRecordsBySession,
);

router.get(
  "/student/:studentId",
  auth(Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN),
  AttendanceRecordController
    .getStudentAttendance,
);

router.get(
  "/:attendanceRecordId",
  auth(Role.INSTRUCTOR),
  AttendanceRecordController
    .getAttendanceRecordById,
);

router.patch(
  "/:attendanceRecordId",
  auth(Role.INSTRUCTOR),
  validateRequest(
    updateAttendanceRecordZodSchema,
  ),
  AttendanceRecordController
    .updateAttendanceRecord,
);

router.delete(
  "/:attendanceRecordId",
  auth(Role.INSTRUCTOR),
  AttendanceRecordController
    .deleteAttendanceRecord,
);

export const AttendanceRecordRoutes = router;