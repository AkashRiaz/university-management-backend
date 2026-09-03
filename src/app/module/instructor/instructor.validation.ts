import z from "zod";
import { Gender, InstructorDesignation, UserStatus } from "../../../generated/prisma/enums";

export const CreateInstructorZodSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z.email("Invalid email address").toLowerCase(),

  designation: z.enum(InstructorDesignation),

  specialization: z
    .string()
    .max(200, "Specialization cannot exceed 200 characters")
    .optional(),

  phone: z.string().max(30, "Phone cannot exceed 30 characters").optional(),

  officeRoom: z
    .string()
    .max(100, "Office room cannot exceed 100 characters")
    .optional(),

  joiningDate: z.coerce.date(),

  dateOfBirth: z.coerce.date().optional(),

  gender: z.enum(Gender).optional(),

  address: z
    .string()
    .max(500, "Address cannot exceed 500 characters")
    .optional(),

  bio: z.string().max(2000, "Bio cannot exceed 2000 characters").optional(),

  qualification: z
    .string()
    .max(500, "Qualification cannot exceed 500 characters")
    .optional(),

  departmentId: z.uuid("Invalid department ID"),
});

export const UpdateInstructorSelfZodSchema = z.object({
  name: z.string().min(2).max(100).optional(),

  specialization: z.string().max(200).optional(),

  phone: z.string().max(30).optional(),

  officeRoom: z.string().max(100).optional(),

  dateOfBirth: z.coerce.date().optional(),

  gender: z.enum(Gender).optional(),

  address: z.string().max(500).optional(),

  bio: z.string().max(2000).optional(),

  qualification: z.string().max(500).optional(),
});

export const UpdateInstructorAdminZodSchema = z.object({
  name: z.string().min(2).max(100).optional(),

  designation: z.enum(InstructorDesignation).optional(),

  joiningDate: z.coerce.date().optional(),

  departmentId: z.uuid().optional(),

  status: z.enum(UserStatus).optional(),
});

export const VerifyInstructorEmailZodSchema = z.object({
  email: z.email("Invalid email address").toLowerCase(),

  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const ResendInstructorOtpZodSchema = z.object({
  email: z.email("Invalid email address").toLowerCase(),
});
