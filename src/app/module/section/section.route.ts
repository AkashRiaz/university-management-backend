import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  CreateSectionZodSchema,
  UpdateSectionZodSchema,
} from "./section.validation";
import { SectionController } from "./section.controller";

const router = Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR),
  validateRequest(CreateSectionZodSchema),
  SectionController.createSection,
);

router.get(
  "/",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.INSTRUCTOR,
    Role.FINANCE_ADMIN,
  ),
  SectionController.getAllSections,
);

router.get(
  "/semester/:semesterId",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.INSTRUCTOR,
    Role.FINANCE_ADMIN,
  ),
  SectionController.getSectionsBySemester,
);

router.get(
  "/course/:courseId",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.INSTRUCTOR,
    Role.FINANCE_ADMIN,
  ),
  SectionController.getSectionsByCourse,
);

router.get(
  "/:id",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.INSTRUCTOR,
    Role.FINANCE_ADMIN,
  ),
  SectionController.getSectionById,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR),
  validateRequest(UpdateSectionZodSchema),
  SectionController.updateSection,
);

router.delete(
  "/:id",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
  ),
  SectionController.deleteSection,
);

export const SectionRoutes = router;