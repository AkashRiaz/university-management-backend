import express from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { CreateFeeStructureZodSchema, UpdateFeeStructureZodSchema } from "./feeStructure.validation";
import { FeeStructureController } from "./feeStructure.controller";


const router =
  express.Router();


// Create
router.post(
  "/",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.FINANCE_ADMIN,
  ),
  validateRequest(
    CreateFeeStructureZodSchema,
  ),
  FeeStructureController.createFeeStructure,
);


// Get by Program
router.get(
  "/program/:programId",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  FeeStructureController.getFeeStructuresByProgram,
);


// Get by Semester
router.get(
  "/semester/:semesterId",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  FeeStructureController.getFeeStructuresBySemester,
);


// Get All
router.get(
  "/",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  FeeStructureController.getAllFeeStructures,
);


// Get By ID
router.get(
  "/:id",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  FeeStructureController.getFeeStructureById,
);


// Update
router.patch(
  "/:id",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.FINANCE_ADMIN,
  ),
  validateRequest(
    UpdateFeeStructureZodSchema,
  ),
  FeeStructureController.updateFeeStructure,
);


// Delete
router.delete(
  "/:id",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
  ),
  FeeStructureController.deleteFeeStructure,
);


export const FeeStructureRoutes = router;