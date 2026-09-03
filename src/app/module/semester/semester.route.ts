import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  CreateSemesterZodSchema,
  UpdateSemesterZodSchema,
} from "./semester.validation";
import { SemesterController } from "./semester.controller";

const router = Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR),
  validateRequest(CreateSemesterZodSchema),
  SemesterController.createSemester,
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
  SemesterController.getAllSemesters,
);

router.get(
  "/academic-year/:academicYearId",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  SemesterController.getSemestersByAcademicYear,
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
  SemesterController.getSemesterById,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR),
  validateRequest(UpdateSemesterZodSchema),
  SemesterController.updateSemester,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  SemesterController.deleteSemester,
);



export const SemesterRoutes = router;