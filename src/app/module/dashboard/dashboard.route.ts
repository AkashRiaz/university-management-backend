import express from "express";

import { DashboardController } from "./dashboard.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

/**
 * ADMIN DASHBOARD
 */

router.get(
  "/admin/overview",

  auth(Role.SUPER_ADMIN, Role.ADMIN),

  DashboardController.getAdminOverview,
);

/**
 * STUDENT DASHBOARD
 */

router.get(
  "/student/overview",

  auth(Role.STUDENT),

  DashboardController.getStudentOverview,
);

export const DashboardRoutes = router;
