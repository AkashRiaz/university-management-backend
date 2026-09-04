import { z } from "zod";

export const CreateSectionZodSchema = z.object({
  name: z.string().trim().min(1, "Section name is required"),

  capacity: z
    .number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1"),

  status: z.enum(["OPEN", "CLOSED", "FULL", "CANCELLED", "COMPLETED"]).optional(),

  courseId: z.uuid(),

  semesterId: z.uuid(),

  departmentId: z.uuid(),

  roomId: z.uuid().optional(),
});

export const UpdateSectionZodSchema = z.object({
  name: z.string().trim().min(1, "Section name is required").optional(),

  capacity: z
    .number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .optional(),

  status: z.enum(["OPEN", "CLOSED", "FULL", "CANCELLED", "COMPLETED"]).optional(),

  courseId: z.uuid().optional(),

  semesterId: z.uuid().optional(),

  departmentId: z.uuid().optional(),

  roomId: z.uuid().nullable().optional(),
});
