import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createSectionInstructorZodSchema,
  updateSectionInstructorZodSchema,
} from "./sectionInstructor.validation";
import { SectionInstructorController } from "./sectionInstructor.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createSectionInstructorZodSchema),
  SectionInstructorController.createSectionInstructor,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  SectionInstructorController.getAllSectionInstructors,
);
router.get(
  "/my-sections",
  auth(Role.INSTRUCTOR),
  SectionInstructorController.getMyInstructorSections,
);

router.get(
  "/section/:sectionId",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  SectionInstructorController.getSectionInstructorsBySection,
);

router.get(
  "/instructor/:instructorId",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  SectionInstructorController.getInstructorSections,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  SectionInstructorController.getSectionInstructorById,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateSectionInstructorZodSchema),
  SectionInstructorController.updateSectionInstructor,
);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  SectionInstructorController.deleteSectionInstructor,
);

export const SectionInstructorRoutes = router;
