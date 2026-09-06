import z from "zod";

export const createDepartmentZodSchema = z.object({
  name: z.string().trim().min(1, "Department name is required"),

  code: z.string().trim().min(1, "Department code is required"),

  description: z.string().trim().optional(),

  building: z.string().trim().optional(),

  phone: z.string().trim().optional(),

  email: z.email("Invalid email address").optional(),

  facultyId: z.uuid("Invalid faculty ID"),
});

export const updateDepartmentZodSchema = z.object({
  name: z.string().trim().min(1, "Department name cannot be empty").optional(),

  code: z.string().trim().min(1, "Department code cannot be empty").optional(),

  description: z.string().trim().optional(),

  building: z.string().trim().optional(),

  phone: z.string().trim().optional(),

  email: z.email("Invalid email address").optional(),

  facultyId: z.uuid("Invalid faculty ID").optional(),
});
