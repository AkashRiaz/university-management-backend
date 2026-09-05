import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createInvoiceItemZodSchema,
  updateInvoiceItemZodSchema,
} from "./invoiceItem.interface";
import { InvoiceItemController } from "./invoiceItem.controller";

const router = Router();

router.post(
  "/",

  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),

  validateRequest(createInvoiceItemZodSchema),

  InvoiceItemController.createInvoiceItem,
);

router.get(
  "/invoice/:invoiceId",

  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.FINANCE_ADMIN,
    Role.REGISTRAR,
    Role.STUDENT,
  ),

  InvoiceItemController.getAllInvoiceItems,
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
  InvoiceItemController.getSingleInvoiceItem,
);

router.patch(
  "/:id",

  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),

  validateRequest(updateInvoiceItemZodSchema),

  InvoiceItemController.updateInvoiceItem,
);

router.delete(
  "/:id",

  auth(Role.SUPER_ADMIN, Role.ADMIN),

  InvoiceItemController.deleteInvoiceItem,
);

export const InvoiceItemRoutes = router;
