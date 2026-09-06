import z from "zod";
import { RegistrationStatus } from "../../../generated/prisma/enums";

export const createRegistrationZodSchema = z.object({
  semesterId: z.uuid("Invalid semester ID"),
});

export const updateRegistrationZodSchema = z.object({
  status: z.enum(RegistrationStatus),
});