import { Router } from "express";
import { StudentController } from "./student.controller";

const router = Router();

router.post("/register", StudentController.registerStudent);

export const StudentRoutes = router;
