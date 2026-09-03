import { z } from "zod";

export const CreateProgramCourseZodSchema = z.object({
  programId: z.uuid(),

  courseId: z.uuid(),

  semesterNumber: z.coerce
    .number()
    .int("Semester number must be an integer")
    .positive("Semester number must be greater than 0"),

  isRequired: z.boolean().optional(),
});

export const UpdateProgramCourseZodSchema = z.object({
  programId: z.uuid().optional(),

  courseId: z.uuid().optional(),

  semesterNumber: z.coerce
    .number()
    .int("Semester number must be an integer")
    .positive("Semester number must be greater than 0")
    .optional(),

  isRequired: z.boolean().optional(),
});
