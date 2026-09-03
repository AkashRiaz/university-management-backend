import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { CreateCoursePrerequisiteZodSchema, UpdateCoursePrerequisiteZodSchema } from "./coursePrerequisite.validation";
import { CoursePrerequisiteController } from "./coursePrerequisite.controller";

const router = Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(CreateCoursePrerequisiteZodSchema),
  CoursePrerequisiteController.createCoursePrerequisite,
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
  CoursePrerequisiteController.getAllCoursePrerequisites,
);

router.get(
  "/course/:courseId",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  CoursePrerequisiteController.getPrerequisitesByCourse,
);

router.get(
  "/prerequisite-course/:prerequisiteCourseId",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  CoursePrerequisiteController.getCoursesByPrerequisite,
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
  CoursePrerequisiteController.getCoursePrerequisiteById,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(UpdateCoursePrerequisiteZodSchema),
  CoursePrerequisiteController.updateCoursePrerequisite,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN),
  CoursePrerequisiteController.deleteCoursePrerequisite,
);

export const CoursePrerequisiteRoutes = router;
