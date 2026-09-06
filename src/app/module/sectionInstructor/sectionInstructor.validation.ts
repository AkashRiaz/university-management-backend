import z from "zod";

export const createSectionInstructorZodSchema = z.object({
  sectionId: z.uuid("Invalid section ID"),

  instructorId: z.uuid("Invalid instructor ID"),

  isPrimary: z.boolean().optional(),
});

export const updateSectionInstructorZodSchema = z.object({
  isPrimary: z.boolean().optional(),
});
