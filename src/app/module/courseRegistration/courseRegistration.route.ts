import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { CourseRegistrationController } from "./courseRegistration.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createCourseRegistrationZodSchema } from "./courseRegistration.validation";

const router = Router();

// ==================== POST ROUTES ====================
router.post(
  "/",
  auth(Role.STUDENT),
  validateRequest(createCourseRegistrationZodSchema),
  CourseRegistrationController.createCourseRegistration,
);

router.post(
  "/:courseRegistrationId/drop",
  auth(Role.STUDENT),
  CourseRegistrationController.dropCourseRegistration,
);

// ==================== GET ROUTES ====================
// 1. Specific / Sub-resource routes first
router.get(
  "/registration/:registrationId",
  auth(Role.STUDENT),
  CourseRegistrationController.getMyCourseRegistrations,
);

router.get(
  "/:registrationId/available-courses",
  auth(Role.STUDENT),
  CourseRegistrationController.getAvailableCoursesForRegistration,
);

// 2. Generic single-parameter route LAST
router.get(
  "/:courseRegistrationId",
  auth(Role.STUDENT),
  CourseRegistrationController.getSingleCourseRegistration,
);

export const CourseRegistrationRoutes = router;
