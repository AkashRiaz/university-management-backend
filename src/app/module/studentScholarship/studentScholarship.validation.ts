import z from "zod";
import { ApplicationStatus } from "../../../generated/prisma/enums";

export const createStudentScholarshipZodSchema = z.object({
  studentId: z.uuid("Invalid student ID"),

  scholarshipId: z.uuid("Invalid scholarship ID"),

  semesterId: z.uuid("Invalid semester ID"),
  status: z.enum(ApplicationStatus).optional(),
});

export const updateStudentScholarshipZodSchema = z.object({
  semesterId: z.uuid("Invalid semester ID").nullable().optional(),

  status: z.enum(ApplicationStatus).optional(),
});
