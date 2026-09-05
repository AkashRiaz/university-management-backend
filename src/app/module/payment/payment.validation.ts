import { z } from "zod";

export const CreateBkashPaymentZodSchema =
  z.object({
    invoiceId: z.uuid(),
  });