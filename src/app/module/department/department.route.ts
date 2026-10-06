import { Router } from "express";
import { DepartmentController } from "./department.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createDepartmentZodSchema,
  updateDepartmentZodSchema,
} from "./department.validation";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createDepartmentZodSchema),
  DepartmentController.createDepartment,
);

router.get(
  "/",
  DepartmentController.getAllDepartments,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR, Role.STUDENT),
  DepartmentController.getDepartmentById,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateDepartmentZodSchema),
  DepartmentController.updateDepartment,
);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  DepartmentController.deleteDepartment,
);

export const DepartmentRoutes = router;
