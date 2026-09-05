import z from "zod";

export const createGradeScaleZodSchema = z.object({
  name: z
    .string()
    .min(1, "Grade scale name is required")
    .max(100, "Grade scale name cannot exceed 100 characters")
    .trim(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .trim()
    .optional(),
});

export const updateGradeScaleZodSchema = z.object({
  name: z
    .string()
    .min(1, "Grade scale name is required")
    .max(100, "Grade scale name cannot exceed 100 characters")
    .trim()
    .optional(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .trim()
    .optional(),
});
