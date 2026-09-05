import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createGradeZodSchema, updateGradeZodSchema } from "./grade.validation";
import { GradeController } from "./grade.controller";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createGradeZodSchema),
  GradeController.createGrade,
);

router.get(
  "/gradescale/:gradeScaleId",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR),
  GradeController.getGradesByGradeScale,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR),
  GradeController.getSingleGrade,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateGradeZodSchema),
  GradeController.updateGrade,
);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  GradeController.deleteGrade,
);

export const GradeRoutes = router;
