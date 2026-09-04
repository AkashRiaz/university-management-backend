import express from "express";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createStudentScholarshipZodSchema,
  updateStudentScholarshipZodSchema,
} from "./studentScholarship.validation";
import { StudentScholarshipController } from "./studentScholarship.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),
  validateRequest(createStudentScholarshipZodSchema),
  StudentScholarshipController.createStudentScholarship,
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
  StudentScholarshipController.getAllStudentScholarships,
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
  StudentScholarshipController.getSingleStudentScholarship,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),
  validateRequest(updateStudentScholarshipZodSchema),
  StudentScholarshipController.updateStudentScholarship,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),
  StudentScholarshipController.deleteStudentScholarship,
);

export const StudentScholarshipRoutes = router;
