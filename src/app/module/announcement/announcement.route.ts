import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
  CreateAnnouncementZodSchema,
  UpdateAnnouncementZodSchema,
} from "./announcement.validation";
import { AnnouncementController } from "./announcement.controller";

const router = Router();

// Create announcement
router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(CreateAnnouncementZodSchema),
  AnnouncementController.createAnnouncement,
);

// Get published announcements
router.get(
  "/published",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
    Role.INSTRUCTOR,
    Role.STUDENT,
  ),
  AnnouncementController.getPublishedAnnouncements,
);

// Get all announcements
router.get(
  "/",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  AnnouncementController.getAllAnnouncements,
);

// Get announcement by ID
router.get(
  "/:id",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.FINANCE_ADMIN,
  ),
  AnnouncementController.getAnnouncementById,
);

// Update announcement
router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(UpdateAnnouncementZodSchema),
  AnnouncementController.updateAnnouncement,
);

// Delete announcement
router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  AnnouncementController.deleteAnnouncement,
);

export const AnnouncementRoutes = router;
