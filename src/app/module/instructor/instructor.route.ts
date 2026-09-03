import express from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { InstructorController } from "./instructor.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  CreateInstructorZodSchema,
  UpdateInstructorAdminZodSchema,
  UpdateInstructorSelfZodSchema,
} from "./instructor.validation";
import { upload } from "../../lib/multer";
const router = express.Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(CreateInstructorZodSchema),
  InstructorController.createInstructor,
);

router.post(
  "/verify-instructor-email",
  InstructorController.verifyInstructorEmail,
);

router.post(
  "/resend-verification-otp",
  InstructorController.resendInstructorVerificationOtp,
);

router.get("/", InstructorController.getAllInstructors);
router.patch(
  "/me",
  auth(Role.INSTRUCTOR),
  upload.fields([
    {
      name: "profileImage",
      maxCount: 1,
    },
    {
      name: "additionalFiles",
      maxCount: 10,
    },
  ]),

  validateRequest(UpdateInstructorSelfZodSchema),

  InstructorController.updateMyProfile,
);

router.patch(
  "/:id/admin",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(UpdateInstructorAdminZodSchema),
  InstructorController.updateInstructorByAdmin,
);
router.get("/:id", InstructorController.getInstructorById);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  InstructorController.deleteInstructor,
);

export const InstructorRoutes = router;
