import { Router } from "express";
import { ProgramController } from "./program.controller";

const router = Router();

router.post("/", ProgramController.createProgram);


export const ProgramRoutes = router;