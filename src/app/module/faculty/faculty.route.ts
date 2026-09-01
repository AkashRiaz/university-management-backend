import { Router } from "express";
import { facultyController } from "./faculty.controller";

const router = Router();

router.post("/", facultyController.createFaculty);

export const FacultyRoutes = router;
