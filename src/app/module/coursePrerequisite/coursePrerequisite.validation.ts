import { z } from "zod";

export const CreateCoursePrerequisiteZodSchema = z.object({
  courseId: z.uuid(),

  prerequisiteCourseId: z.uuid(),

  minimumGrade: z
    .string()
    .trim()
    .min(1, "Minimum grade cannot be empty")
    .optional(),
});

export const UpdateCoursePrerequisiteZodSchema = z.object({
  courseId: z.string().uuid().optional(),

  prerequisiteCourseId: z.string().uuid().optional(),

  minimumGrade: z
    .string()
    .trim()
    .min(1, "Minimum grade cannot be empty")
    .optional(),
});
