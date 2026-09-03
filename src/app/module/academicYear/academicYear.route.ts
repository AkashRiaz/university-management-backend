import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { AcademicYearController } from "./academicYear.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { CreateAcademicYearZodSchema, UpdateAcademicYearZodSchema } from "./academicYear.validation";
const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(CreateAcademicYearZodSchema),
  AcademicYearController.createAcademicYear,
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
  AcademicYearController.getAllAcademicYears,
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
  AcademicYearController.getAcademicYearById,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(UpdateAcademicYearZodSchema),
  AcademicYearController.updateAcademicYear,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  AcademicYearController.deleteAcademicYear,
);

export const AcademicYearRoutes = router;
