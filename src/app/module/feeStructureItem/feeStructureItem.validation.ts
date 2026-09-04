import { z } from "zod";

export const CreateFeeStructureItemZodSchema = z.object({
  feeStructureId: z.uuid("Invalid fee structure ID"),

  name: z
    .string()
    .min(1, "Item name is required")
    .max(255, "Item name cannot exceed 255 characters"),

  description: z.string().optional(),

  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

export const UpdateFeeStructureItemZodSchema = z.object({
  name: z
    .string()
    .min(1, "Item name is required")
    .max(255, "Item name cannot exceed 255 characters")
    .optional(),

  description: z.string().nullable().optional(),

  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .optional(),
});
