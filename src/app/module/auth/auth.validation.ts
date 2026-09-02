import { z } from "zod";

export const EmailVerifyZodSchema = z.object({
  email: z.email("Email must be a valid email address"),
  otp: z.string().length(6, "OTP must be 6 characters long"),
});
