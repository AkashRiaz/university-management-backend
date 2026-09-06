import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createRegistrationZodSchema } from "./registration.validation";
import { RegistrationController } from "./registration.controller";

const router = Router();

router.post(
  "/",
  auth(Role.STUDENT),
  validateRequest(createRegistrationZodSchema),
  RegistrationController.createRegistration,
);

router.get(
  "/my-registrations",
  auth(Role.STUDENT),
  RegistrationController.getMyRegistrations,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  RegistrationController.getAllRegistrations,
);

router.get(
  "/:registrationId",
  auth(Role.STUDENT, Role.ADMIN, Role.SUPER_ADMIN),
  RegistrationController.getSingleRegistration,
);

router.post(
  "/:registrationId/submit",
  auth(Role.STUDENT),
  RegistrationController.submitRegistration,
);

router.post(
  "/:registrationId/approve",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  RegistrationController.approveRegistration,
);

router.post(
  "/:registrationId/reject",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  RegistrationController.rejectRegistration,
);


export const RegistrationRoutes = router;
