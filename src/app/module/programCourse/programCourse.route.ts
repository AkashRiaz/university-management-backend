import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { CreateProgramCourseZodSchema, UpdateProgramCourseZodSchema } from "./programCourse.validation";
import { ProgramCourseController } from "./programCourse.controller";

const router = Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(CreateProgramCourseZodSchema),
  ProgramCourseController.createProgramCourse,
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
  ProgramCourseController.getAllProgramCourses,
);

router.get(
  "/program/:programId",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  ProgramCourseController.getCoursesByProgram,
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
  ProgramCourseController.getProgramsByCourse,
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
  ProgramCourseController.getProgramCourseById,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(UpdateProgramCourseZodSchema),
  ProgramCourseController.updateProgramCourse,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  ProgramCourseController.deleteProgramCourse,
);


export const ProgramCourseRoutes = router;
