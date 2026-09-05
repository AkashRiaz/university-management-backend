import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createGradeScaleZodSchema, updateGradeScaleZodSchema } from "./gradeScale.validation";
import { GradeScaleController } from "./gradeScale.controller";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createGradeScaleZodSchema),
  GradeScaleController.createGradeScale,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR),
  GradeScaleController.getAllGradeScales,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR),
  GradeScaleController.getSingleGradeScale,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateGradeScaleZodSchema),
  GradeScaleController.updateGradeScale,
);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  GradeScaleController.deleteGradeScale,
);

export const GradeScaleRoutes = router;
