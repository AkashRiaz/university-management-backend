import { z } from "zod";

export const CreateCourseZodSchema = z.object({
  code: z
    .string()
    .min(1, "Course code is required")
    .max(20, "Course code cannot exceed 20 characters")
    .trim(),

  title: z
    .string()
    .min(1, "Course title is required")
    .max(200, "Course title cannot exceed 200 characters")
    .trim(),

  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .trim()
    .optional(),

  credit: z.coerce
    .number()
    .positive("Credit must be greater than 0")
    .max(99.99, "Credit cannot exceed 99.99"),

  courseType: z.enum(["THEORY", "LAB", "PROJECT", "THESIS", "SEMINAR"]),

  courseLevel: z.enum(["UNDERGRADUATE", "POSTGRADUATE", "PHD"]),

  departmentId: z.uuid(),
});

export const UpdateCourseZodSchema = z.object({
  code: z
    .string()
    .min(1, "Course code is required")
    .max(20, "Course code cannot exceed 20 characters")
    .trim()
    .optional(),

  title: z
    .string()
    .min(1, "Course title is required")
    .max(200, "Course title cannot exceed 200 characters")
    .trim()
    .optional(),

  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .trim()
    .optional(),

  credit: z.coerce
    .number()
    .positive("Credit must be greater than 0")
    .max(99.99, "Credit cannot exceed 99.99")
    .optional(),

  courseType: z
    .enum(["THEORY", "LAB", "PROJECT", "THESIS", "SEMINAR"])
    .optional(),

  courseLevel: z.enum(["UNDERGRADUATE", "POSTGRADUATE", "PHD"]).optional(),

  departmentId: z.uuid().optional(),
});
