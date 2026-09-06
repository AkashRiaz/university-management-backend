import z from "zod";

export const createAttendanceSessionZodSchema =
  z.object({
    sectionId: z.uuid("Invalid section ID"),

    date: z.coerce.date({
      error: "Invalid attendance date",
    }),

    topic: z
      .string()
      .trim()
      .min(1, "Topic cannot be empty")
      .optional(),
  });

export const updateAttendanceSessionZodSchema =
  z.object({
    date: z.coerce.date({
      error: "Invalid attendance date",
    }).optional(),

    topic: z
      .string()
      .trim()
      .min(1, "Topic cannot be empty")
      .optional(),
  });