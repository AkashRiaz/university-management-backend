import z from "zod";
import { GradeType } from "../../../generated/prisma/enums";

export const createGradeZodSchema = z.object({
  letter: z
    .string()
    .min(1, "Grade letter is required")
    .max(20, "Grade letter cannot exceed 20 characters")
    .trim(),

  minMarks: z.number().nonnegative("Minimum marks cannot be negative"),

  maxMarks: z.number().nonnegative("Maximum marks cannot be negative"),

  gradePoint: z.number().nonnegative("Grade point cannot be negative"),

  type: z.enum(GradeType),

  gradeScaleId: z.uuid("Invalid grade scale ID"),
});

export const updateGradeZodSchema = z.object({
  letter: z
    .string()
    .min(1, "Grade letter is required")
    .max(20, "Grade letter cannot exceed 20 characters")
    .trim()
    .optional(),

  minMarks: z
    .number()
    .nonnegative("Minimum marks cannot be negative")
    .optional(),

  maxMarks: z
    .number()
    .nonnegative("Maximum marks cannot be negative")
    .optional(),

  gradePoint: z
    .number()
    .nonnegative("Grade point cannot be negative")
    .optional(),

  type: z.enum(GradeType).optional(),

  gradeScaleId: z.uuid("Invalid grade scale ID").optional(),
});
