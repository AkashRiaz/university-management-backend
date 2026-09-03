import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  EmailVerifyZodSchema,
  ForgotPasswordZodSchema,
  LoginZodSchema,
  ResetPasswordZodSchema,
} from "./auth.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/verify-email",
  validateRequest(EmailVerifyZodSchema),
  AuthController.verifyStudentEmail,
);

router.post(
  "/login",
  validateRequest(LoginZodSchema),
  AuthController.loginUser,
);

router.post("/google", AuthController.googleLoginForStudent);
router.post("/refresh-token", AuthController.refreshToken);
router.post(
  "/forgot-password",
  validateRequest(ForgotPasswordZodSchema),
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest(ResetPasswordZodSchema),
  AuthController.resetPassword,
);

router.get(
  "/me",
  auth(
    Role.STUDENT,
    Role.DEPARTMENT_ADMIN,
    Role.FINANCE_ADMIN,
    Role.INSTRUCTOR,
    Role.SUPER_ADMIN,
  ),
  AuthController.getMe,
);
router.post("/logout", AuthController.logout);

export const AuthRoutes = router;
