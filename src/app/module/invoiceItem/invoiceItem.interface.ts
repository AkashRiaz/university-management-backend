export interface ICreateInvoiceItemPayload {
  invoiceId: string;

  name: string;

  description?: string;

  quantity?: number;

  unitPrice: number;
}

export interface IUpdateInvoiceItemPayload {
  name?: string;

  description?: string | null;

  quantity?: number;

  unitPrice?: number;
}

import { z } from "zod";

export const createInvoiceItemZodSchema = z.object({
  invoiceId: z.uuid("Invalid invoice ID"),

  name: z
    .string({
      error: "Name is required",
    })
    .trim()
    .min(1, "Name is required")
    .max(255, "Name cannot exceed 255 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),

  quantity: z
    .number({
      error: "Quantity must be a number",
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0")
    .optional(),

  unitPrice: z
    .number({
      error: "Unit price must be a number",
    })
    .nonnegative("Unit price cannot be negative"),
});

export const updateInvoiceItemZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(255, "Name cannot exceed 255 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullable()
    .optional(),

  quantity: z
    .number({
      error: "Quantity must be a number",
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0")
    .optional(),

  unitPrice: z
    .number({
      error: "Unit price must be a number",
    })
    .nonnegative("Unit price cannot be negative")
    .optional(),
});
