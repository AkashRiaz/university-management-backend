import z from "zod";
import {
  ScholarshipStatus,
  ScholarshipType,
} from "../../../generated/prisma/enums";

export const createScholarshipZodSchema = z
  .object({
    name: z.string().trim().min(1, "Scholarship name is required"),

    type: z.enum(ScholarshipType),

    percentage: z
      .number()
      .positive("Percentage must be greater than 0")
      .max(100, "Percentage cannot exceed 100")
      .optional(),

    fixedAmount: z
      .number()
      .positive("Fixed amount must be greater than 0")
      .optional(),

    description: z.string().trim().optional(),

    status: z.enum(ScholarshipStatus).optional(),
  })
  .refine(
    (data) =>
      !(data.percentage !== undefined && data.fixedAmount !== undefined),
    {
      message: "Percentage and fixed amount cannot be provided together",
      path: ["percentage"],
    },
  )
  .refine(
    (data) => data.percentage !== undefined || data.fixedAmount !== undefined,
    {
      message: "Either percentage or fixed amount is required",
      path: ["percentage"],
    },
  );

export const updateScholarshipZodSchema = z
  .object({
    name: z.string().trim().min(1, "Scholarship name is required").optional(),

    type: z.enum(ScholarshipType).optional(),

    percentage: z
      .number()
      .positive("Percentage must be greater than 0")
      .max(100, "Percentage cannot exceed 100")
      .nullable()
      .optional(),

    fixedAmount: z
      .number()
      .positive("Fixed amount must be greater than 0")
      .nullable()
      .optional(),

    description: z.string().trim().nullable().optional(),

    status: z.enum(ScholarshipStatus).optional(),
  })
  .refine(
    (data) => {
      if (data.percentage !== undefined && data.fixedAmount !== undefined) {
        return data.percentage === null || data.fixedAmount === null;
      }

      return true;
    },
    {
      message: "Percentage and fixed amount cannot both have values",
      path: ["percentage"],
    },
  );
