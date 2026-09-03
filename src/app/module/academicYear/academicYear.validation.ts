import { z } from "zod";

export const CreateAcademicYearZodSchema = z
  .object({
    name: z.string().min(1, "Academic year name is required").trim(),

    startDate: z.coerce.date({
      message: "Valid start date is required",
    }),

    endDate: z.coerce.date({
      message: "Valid end date is required",
    }),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const UpdateAcademicYearZodSchema = z
  .object({
    name: z.string().min(1, "Academic year name is required").trim().optional(),

    startDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }

      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );
