import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();

router.post("/verify-email", AuthController.verifyStudentEmail);
router.post("/refresh-token", AuthController.refreshToken);

export const AuthRoutes = router;
