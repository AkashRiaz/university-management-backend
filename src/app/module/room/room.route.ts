import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { CreateRoomZodSchema, UpdateRoomZodSchema } from "./room.validation";
import { RoomController } from "./room.controller";

const router = Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(CreateRoomZodSchema),
  RoomController.createRoom,
);

router.get(
  "/",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.INSTRUCTOR,
    Role.FINANCE_ADMIN,
  ),
  RoomController.getAllRooms,
);

router.get(
  "/:id",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DEPARTMENT_ADMIN,
    Role.REGISTRAR,
    Role.INSTRUCTOR,
    Role.FINANCE_ADMIN,
  ),
  RoomController.getRoomById,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(UpdateRoomZodSchema),
  RoomController.updateRoom,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  RoomController.deleteRoom,
);


export const RoomRoutes = router;