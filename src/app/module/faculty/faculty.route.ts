import { Router } from "express";
import { facultyController } from "./faculty.controller";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createFacultyZodSchema,
  updateFacultyZodSchema,
} from "./faculty.validation";

const router = Router();


router.post(
  "/",
  auth("ADMIN", "SUPER_ADMIN"),
  validateRequest(createFacultyZodSchema),
  facultyController.createFaculty,
);

router.get(
  "/",
  auth("ADMIN", "SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  facultyController.getAllFaculties,
);

router.get(
  "/:id",
  auth("ADMIN", "SUPER_ADMIN", "INSTRUCTOR", "STUDENT"),
  facultyController.getFacultyById,
);

router.patch(
  "/:id",
  auth("ADMIN", "SUPER_ADMIN"),
  validateRequest(updateFacultyZodSchema),
  facultyController.updateFaculty,
);

router.delete(
  "/:id",
  auth("ADMIN", "SUPER_ADMIN"),
  facultyController.deleteFaculty,
);

export const FacultyRoutes = router;
