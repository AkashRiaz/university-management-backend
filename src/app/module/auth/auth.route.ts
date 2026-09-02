import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { EmailVerifyZodSchema } from "./auth.validation";

const router = Router();

router.post(
  "/verify-email",
  validateRequest(EmailVerifyZodSchema),
  AuthController.verifyStudentEmail,
);

router.post("/google", AuthController.googleLoginForStudent);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", AuthController.logout);

export const AuthRoutes = router;
