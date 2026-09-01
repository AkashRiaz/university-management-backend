import { Router } from "express";
import { DepartmentController } from "./department.controller";

const router = Router();

router.post("/", DepartmentController.createDepartment);

export const DepartmentRoutes = router;
