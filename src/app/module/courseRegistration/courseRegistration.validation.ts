import z from "zod";
import { CourseRegistrationStatus } from "../../../generated/prisma/enums";

export const createCourseRegistrationZodSchema = z.object({
  registrationId: z.uuid("Invalid registration ID"),

  sectionId: z.uuid("Invalid section ID"),
});

export const updateCourseRegistrationZodSchema = z.object({
  status: z.enum(CourseRegistrationStatus),
});
