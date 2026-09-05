import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { PaymentController } from "./payment.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { CreateBkashPaymentZodSchema } from "./payment.validation";

const router = Router();

router.post(
  "/bkash/create",
  auth(Role.STUDENT),
  validateRequest(CreateBkashPaymentZodSchema),
  PaymentController.createBkashPayment,
);

router.get("/bkash/callback", PaymentController.bkashPaymentCallback);

router.get("/my-payments", auth(Role.STUDENT), PaymentController.getMyPayments);

router.get(
  "/all-payments",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  PaymentController.getAllPayments,
);

router.get(
  "/:paymentId",
  auth(Role.STUDENT, Role.ADMIN, Role.SUPER_ADMIN),
  PaymentController.getSinglePayment,
);

export const PaymentRoutes = router;
