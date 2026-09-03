import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { CreateCourseZodSchema, UpdateCourseZodSchema } from "./course.validation";
import { CourseController } from "./course.controller";

const router = Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(CreateCourseZodSchema),
  CourseController.createCourse,
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
  CourseController.getAllCourses,
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
  CourseController.getCourseById,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(UpdateCourseZodSchema),
  CourseController.updateCourse,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  CourseController.deleteCourse,
);

export const CourseRoutes = router;