import z from "zod";
import { InvoiceStatus } from "../../../generated/prisma/enums";

export const createInvoiceZodSchema = z.object({
  studentId: z.uuid("Invalid student ID"),

  semesterId: z.uuid("Invalid semester ID"),

  dueDate: z.coerce.date({
    error: "Invalid due date",
  }),

  discount: z.number().nonnegative("Discount cannot be negative").optional(),

  tax: z.number().nonnegative("Tax cannot be negative").optional(),
});

export const updateInvoiceZodSchema = z.object({
  dueDate: z.coerce
    .date({
      error: "Invalid due date",
    })
    .optional(),

  discount: z.number().nonnegative("Discount cannot be negative").optional(),

  tax: z.number().nonnegative("Tax cannot be negative").optional(),

  status: z.enum(InvoiceStatus).optional(),
});
