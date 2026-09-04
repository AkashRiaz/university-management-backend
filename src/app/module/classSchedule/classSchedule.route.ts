import express from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  CreateClassScheduleZodSchema,
  UpdateClassScheduleZodSchema,
} from "./classSchedule.validation";
import { ClassScheduleController } from "./classSchedule.controller";

const router = express.Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR),
  validateRequest(CreateClassScheduleZodSchema),
  ClassScheduleController.createClassSchedule,
);

router.get(
  "/",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  ClassScheduleController.getAllClassSchedules,
);

router.get(
  "/section/:sectionId",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  ClassScheduleController.getClassSchedulesBySection,
);

router.get(
  "/department/:departmentId",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  ClassScheduleController.getClassSchedulesByDepartment,
);

router.get(
  "/:id",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  ClassScheduleController.getClassScheduleById,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR),
  validateRequest(UpdateClassScheduleZodSchema),
  ClassScheduleController.updateClassSchedule,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  ClassScheduleController.deleteClassSchedule,
);

export const ClassScheduleRoutes = router;
