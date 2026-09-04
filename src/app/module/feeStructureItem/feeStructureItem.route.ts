import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  CreateFeeStructureItemZodSchema,
  UpdateFeeStructureItemZodSchema,
} from "./feeStructureItem.validation";
import { FeeStructureItemController } from "./feeStructureItem.controller";

const router = Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),
  validateRequest(CreateFeeStructureItemZodSchema),
  FeeStructureItemController.createFeeStructureItem,
);

router.get(
  "/fee-structure/:feeStructureId",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  FeeStructureItemController.getItemsByFeeStructure,
);

router.get(
  "/",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  FeeStructureItemController.getAllFeeStructureItems,
);

router.get(
  "/:id",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  FeeStructureItemController.getFeeStructureItemById,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN),
  validateRequest(UpdateFeeStructureItemZodSchema),
  FeeStructureItemController.updateFeeStructureItem,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  FeeStructureItemController.deleteFeeStructureItem,
);


export const FeeStructureItemRoutes = router;