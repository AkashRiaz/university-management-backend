import z from "zod";

export const createFacultyZodSchema = z.object({
  name: z.string().trim().min(1, "Faculty name is required"),

  code: z.string().trim().min(1, "Faculty code is required"),

  description: z.string().trim().optional(),
});

export const updateFacultyZodSchema = z.object({
  name: z.string().trim().min(1, "Faculty name cannot be empty").optional(),

  code: z.string().trim().min(1, "Faculty code cannot be empty").optional(),

  description: z.string().trim().optional(),
});
