import { z } from "zod";

export const CreateRoomZodSchema = z.object({
  building: z.string().trim().min(1, "Building is required"),

  roomNumber: z.string().trim().min(1, "Room number is required"),

  capacity: z
    .number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1"),
});

export const UpdateRoomZodSchema = z.object({
  building: z.string().trim().min(1, "Building is required").optional(),

  roomNumber: z.string().trim().min(1, "Room number is required").optional(),

  capacity: z
    .number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .optional(),
});
