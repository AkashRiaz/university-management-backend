import { z } from "zod";

export const CreateFeeStructureZodSchema = z.object({
  name: z
    .string()
    .min(1, "Fee structure name is required")
    .max(255, "Fee structure name cannot exceed 255 characters"),

  description: z.string().optional(),

  programId: z.uuid().optional(),

  semesterId: z.uuid().optional(),
});

export const UpdateFeeStructureZodSchema = z.object({
  name: z
    .string()
    .min(1, "Fee structure name is required")
    .max(255, "Fee structure name cannot exceed 255 characters")
    .optional(),

  description: z.string().nullable().optional(),

  programId: z.uuid().nullable().optional(),

  semesterId: z.uuid().nullable().optional(),
});
