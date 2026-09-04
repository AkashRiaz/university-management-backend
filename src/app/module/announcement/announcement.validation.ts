import { z } from "zod";

export const CreateAnnouncementZodSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title cannot exceed 255 characters"),

    content: z.string().min(1, "Content is required"),

    isPublished: z.boolean().optional(),

    publishedAt: z.coerce.date().optional(),

    expiresAt: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.publishedAt && data.expiresAt) {
        return data.expiresAt > data.publishedAt;
      }

      return true;
    },
    {
      message: "Expiration date must be after published date",
      path: ["expiresAt"],
    },
  );

export const UpdateAnnouncementZodSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title cannot exceed 255 characters")
      .optional(),

    content: z.string().min(1, "Content is required").optional(),

    isPublished: z.boolean().optional(),

    publishedAt: z.coerce.date().nullable().optional(),

    expiresAt: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.publishedAt && data.expiresAt) {
        return data.expiresAt > data.publishedAt;
      }

      return true;
    },
    {
      message: "Expiration date must be after published date",
      path: ["expiresAt"],
    },
  );
