import { z } from "zod";

export const EmailVerifyZodSchema = z.object({
  email: z.email("Email must be a valid email address"),
  otp: z.string().length(6, "OTP must be 6 characters long"),
});

export const LoginZodSchema = z.object({
  email: z.email("Email is not valid"),
  password: z.string().min(8, "Password Must Minimum 8 Characters Long."),
});

export const ForgotPasswordZodSchema = z.object({
  email: z.email(),
});

export const ResetPasswordZodSchema = z.object({
  email: z.email(),
  newPassword: z
    .string()
    .min(8, "Password Must Minimum 8 Characters Long.")
    .regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
    .regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")

    .regex(/[0-9]/, "Password must contain atleast 1 Number")
    .regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
  otp: z.string().length(6, "OTP must be 6 digits long"),
});
