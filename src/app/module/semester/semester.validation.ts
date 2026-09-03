import { z } from "zod";

export const CreateSemesterZodSchema = z
  .object({
    name: z.enum(["SPRING", "SUMMER", "FALL", "WINTER"]),

    startDate: z.coerce.date(),

    endDate: z.coerce.date(),

    registrationStart: z.coerce.date(),

    registrationEnd: z.coerce.date(),

    status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),

    academicYearId: z.string().uuid(),
  })

  // Semester dates
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })

  // Registration dates
  .refine((data) => data.registrationEnd > data.registrationStart, {
    message: "Registration end date must be after registration start date",
    path: ["registrationEnd"],
  })

  // Registration must finish before semester
  .refine((data) => data.registrationEnd <= data.startDate, {
    message: "Registration must end before the semester starts",
    path: ["registrationEnd"],
  });

export const UpdateSemesterZodSchema = z
  .object({
    name: z.enum(["SPRING", "SUMMER", "FALL", "WINTER"]).optional(),

    startDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),

    registrationStart: z.coerce.date().optional(),

    registrationEnd: z.coerce.date().optional(),

    status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),

    academicYearId: z.string().uuid().optional(),
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
  )

  .refine(
    (data) => {
      if (data.registrationStart && data.registrationEnd) {
        return data.registrationEnd > data.registrationStart;
      }

      return true;
    },
    {
      message: "Registration end date must be after registration start date",
      path: ["registrationEnd"],
    },
  );
