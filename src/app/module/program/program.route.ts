import { Router } from "express";
import { ProgramController } from "./program.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  CreateProgramZodSchema,
  UpdateProgramZodSchema,
} from "./program.validation";

const router = Router();

router.post(
  "/",
  validateRequest(CreateProgramZodSchema),
  ProgramController.createProgram,
);

router.get("/", ProgramController.getAllPrograms);

router.get(
  "/department/:departmentId",
  ProgramController.getProgramsByDepartment,
);
router.get("/:id", ProgramController.getProgramById);
router.patch(
  "/:id",
  validateRequest(UpdateProgramZodSchema),
  ProgramController.updateProgram,
);
router.delete("/:id", ProgramController.deleteProgram);

export const ProgramRoutes = router;
