
import z from "zod";

export const createStudentZodSchema = z.object({
  name: z.string().trim().min(1, "Student name is required"),

  email: z.email("Invalid email address"),

  departmentId: z.string().trim().min(1, "Department ID is required"),

  programId: z.string().trim().min(1, "Program ID is required"),

  admissionDate: z.coerce.date({
    message: "Admission date is required",
  }),

  admissionYear: z.coerce
    .number()
    .int("Admission year must be an integer")
    .min(2000, "Invalid admission year")
    .max(new Date().getFullYear() + 1, "Invalid admission year"),

  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

  phone: z.string().trim().optional(),

  address: z.string().trim().optional(),

  emergencyContactName: z.string().trim().optional(),

  emergencyContactPhone: z.string().trim().optional(),
});

export const ResendStudentOtpZodSchema = z.object({
  email: z.email("Invalid email address").toLowerCase(),
});

/*
 * Student can update only their own
 * personal/profile information.
 */
export const UpdateStudentSelfZodSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),

  dateOfBirth: z.coerce.date().optional(),

  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),

  phone: z.string().trim().optional(),

  address: z.string().trim().optional(),

  emergencyContactName: z.string().trim().optional(),

  emergencyContactPhone: z.string().trim().optional(),
});

/*
 * Admin can update controlled student data.
 */
export const UpdateStudentAdminZodSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),

  email: z.email("Invalid email address").optional(),

  departmentId: z
    .string()
    .trim()
    .min(1, "Department ID cannot be empty")
    .optional(),

  programId: z.string().trim().min(1, "Program ID cannot be empty").optional(),

  admissionDate: z.coerce.date().optional(),

  admissionYear: z.coerce
    .number()
    .int("Admission year must be an integer")
    .min(2000)
    .max(new Date().getFullYear() + 1)
    .optional(),

  currentSemesterNumber: z.coerce.number().int().min(1).optional(),

  status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "SUSPENDED"]).optional(),

  academicStatus: z
    .enum(["GOOD_STANDING", "PROBATION", "SUSPENDED", "DISMISSED"])
    .optional(),
});
