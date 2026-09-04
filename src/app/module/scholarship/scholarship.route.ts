import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createScholarshipZodSchema,
  updateScholarshipZodSchema,
} from "./scholarship.validation";
import { ScholarshipController } from "./scholarship.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),
  validateRequest(createScholarshipZodSchema),
  ScholarshipController.createScholarship,
);

router.get(
  "/",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.FINANCE_ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
  ),
  ScholarshipController.getAllScholarships,
);

router.get(
  "/:id",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.FINANCE_ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
  ),
  ScholarshipController.getSingleScholarship,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),
  validateRequest(updateScholarshipZodSchema),
  ScholarshipController.updateScholarship,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),
  ScholarshipController.deleteScholarship,
);

export const ScholarshipRoutes = router;
