import { Router } from "express";
import { StudentController } from "./student.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createStudentZodSchema,
  ResendStudentOtpZodSchema,
  UpdateStudentAdminZodSchema,
  UpdateStudentSelfZodSchema,
} from "./student.validation";
import { upload } from "../../lib/multer";

const router = Router();

router.post(
  "/register",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createStudentZodSchema),
  StudentController.registerStudent,
);

router.post(
  "/resend-verification-otp",
  validateRequest(ResendStudentOtpZodSchema),
  StudentController.resendStudentVerificationOtp,
);


router.get(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR),
  StudentController.getAllStudents,
);


router.get(
  "/me",
  auth(Role.STUDENT),
  StudentController.getMyStudentProfile,
);


router.patch(
  "/me",
  auth(Role.STUDENT),
  upload.fields([
    {
      name: "profileImage",
      maxCount: 1,
    },
  ]),
  validateRequest(UpdateStudentSelfZodSchema),
  StudentController.updateMyProfile,
);


router.get(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR),
  StudentController.getStudentById,
);


router.patch(
  "/:id/admin",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(UpdateStudentAdminZodSchema),
  StudentController.updateStudentByAdmin,
);


router.delete(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  StudentController.deleteStudent,
);

export const StudentRoutes = router;
