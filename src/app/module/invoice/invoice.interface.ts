import { InvoiceStatus } from "../../../generated/prisma/enums";

export interface ICreateInvoicePayload {
  studentId: string;

  semesterId: string;

  dueDate: Date;

  discount?: number;

  tax?: number;
}

export interface IUpdateInvoicePayload {
  dueDate?: Date;

  discount?: number;

  tax?: number;

  status?: InvoiceStatus;
}
