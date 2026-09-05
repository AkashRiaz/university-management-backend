import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createInvoiceZodSchema,
  updateInvoiceZodSchema,
} from "./invoice.validation";
import { InvoiceController } from "./invoice.controller";

const router = Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),
  validateRequest(createInvoiceZodSchema),
  InvoiceController.createInvoice,
);

router.get(
  "/",

  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.FINANCE_ADMIN,
    Role.REGISTRAR,
    Role.STUDENT,
  ),

  InvoiceController.getAllInvoices,
);

router.get(
  "/:id",

  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.FINANCE_ADMIN,
    Role.REGISTRAR,
    Role.STUDENT,
  ),

  InvoiceController.getSingleInvoice,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),
  validateRequest(updateInvoiceZodSchema),
  InvoiceController.updateInvoice,
);

router.delete(
  "/:id",

  auth(Role.SUPER_ADMIN, Role.ADMIN),

  InvoiceController.deleteInvoice,
);

export const InvoiceRoutes = router;
