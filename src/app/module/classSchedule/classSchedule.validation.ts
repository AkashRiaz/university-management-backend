import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const CreateClassScheduleZodSchema = z
  .object({
    dayOfWeek: z.number().int().min(1).max(7),

    startTime: z
      .string()
      .regex(timeRegex, "Start time must be in HH:mm format"),

    endTime: z.string().regex(timeRegex, "End time must be in HH:mm format"),

    sectionId: z.uuid(),

    roomId: z.uuid().optional(),

    departmentId: z.string().uuid(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const UpdateClassScheduleZodSchema = z
  .object({
    dayOfWeek: z.number().int().min(1).max(7).optional(),

    startTime: z
      .string()
      .regex(timeRegex, "Start time must be in HH:mm format")
      .optional(),

    endTime: z
      .string()
      .regex(timeRegex, "End time must be in HH:mm format")
      .optional(),

    sectionId: z.uuid().optional(),

    roomId: z.uuid().nullable().optional(),

    departmentId: z.uuid().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime !== undefined && data.endTime !== undefined) {
        return data.startTime < data.endTime;
      }

      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );
