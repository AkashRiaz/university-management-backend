import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createAttendanceSessionZodSchema,
  updateAttendanceSessionZodSchema,
} from "./attendanceSession.validation";
import { AttendanceSessionController } from "./attendanceSession.controller";
import { Router } from "express";
const router = Router();

router.post(
  "/",
  auth(Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createAttendanceSessionZodSchema),
  AttendanceSessionController.createAttendanceSession,
);

router.get(
  "/section/:sectionId",
  auth(Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN),
  AttendanceSessionController.getAttendanceSessionsBySection,
);

router.get(
  "/:attendanceSessionId",
  auth(Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN),
  AttendanceSessionController.getSingleAttendanceSession,
);

router.patch(
  "/:attendanceSessionId",
  auth(Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateAttendanceSessionZodSchema),
  AttendanceSessionController.updateAttendanceSession,
);

router.delete(
  "/:attendanceSessionId",
  auth(Role.INSTRUCTOR, Role.ADMIN, Role.SUPER_ADMIN),
  AttendanceSessionController.deleteAttendanceSession,
);

export const AttendanceSessionRoutes = router;
