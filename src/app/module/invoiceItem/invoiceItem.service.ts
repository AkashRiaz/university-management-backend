import { Prisma } from "../../../generated/prisma/client";
import { InvoiceStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { calculateInvoiceTotals } from "../invoice/invoice.utils";
import httpStatus from "http-status";
import {
  ICreateInvoiceItemPayload,
  IUpdateInvoiceItemPayload,
} from "./invoiceItem.interface";

const recalculateInvoice = async (
  tx: Prisma.TransactionClient,
  invoiceId: string,
) => {
  // ==========================================
  // 1. Get invoice
  // ==========================================

  const invoice = await tx.invoice.findUnique({
    where: {
      id: invoiceId,
    },
  });

  if (!invoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  // ==========================================
  // 2. Cannot modify cancelled invoice
  // ==========================================

  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cancelled invoice cannot be modified",
    );
  }

  // ==========================================
  // 3. Get all invoice items
  // ==========================================

  const items = await tx.invoiceItem.findMany({
    where: {
      invoiceId,
    },
  });

  // ==========================================
  // 4. Calculate subtotal
  // ==========================================

  const subtotal = items.reduce(
    (total: Prisma.Decimal, item) => {
      return total.plus(item.totalPrice);
    },

    new Prisma.Decimal(0),
  );

  // ==========================================
  // 5. Existing discount
  // ==========================================

  const discount = invoice.discount;

  // ==========================================
  // 6. Existing tax
  // ==========================================

  const tax = invoice.tax;

  // ==========================================
  // 7. Prevent discount > subtotal
  // ==========================================

  if (discount.greaterThan(subtotal)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invoice items cannot be changed because the discount is greater than the new subtotal",
    );
  }

  // ==========================================
  // 8. Calculate total
  // ==========================================

  const totals = calculateInvoiceTotals({
    subtotal,

    discount,

    tax,
  });

  // ==========================================
  // 9. Consider paid amount
  // ==========================================

  const dueAmount = totals.total.minus(invoice.paidAmount);

  if (dueAmount.lessThan(0)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "New invoice total cannot be less than the amount already paid",
    );
  }

  // ==========================================
  // 10. Determine status
  // ==========================================

  let status: InvoiceStatus = invoice.status;

  if (invoice.paidAmount.greaterThan(0)) {
    if (dueAmount.equals(0)) {
      status = InvoiceStatus.PAID;
    } else {
      status = InvoiceStatus.PARTIALLY_PAID;
    }
  } else {
    status = InvoiceStatus.ISSUED;
  }

  // ==========================================
  // 11. Update invoice
  // ==========================================

  return tx.invoice.update({
    where: {
      id: invoiceId,
    },

    data: {
      subtotal,

      total: totals.total,

      dueAmount,

      status,
    },
  });
};

const createInvoiceItem = async (payload: ICreateInvoiceItemPayload) => {
  const result = await prisma.$transaction(async (tx) => {
    // ==========================================
    // 1. Find invoice
    // ==========================================

    const invoice = await tx.invoice.findUnique({
      where: {
        id: payload.invoiceId,
      },
    });

    if (!invoice) {
      throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
    }

    // ==========================================
    // 2. Prevent modification after payment
    // ==========================================

    if (invoice.paidAmount.greaterThan(0)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invoice items cannot be added after payment",
      );
    }

    // ==========================================
    // 3. Prevent cancelled
    // ==========================================

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot add item to cancelled invoice",
      );
    }

    // ==========================================
    // 4. Calculate total price
    // ==========================================

    const quantity = payload.quantity ?? 1;

    const unitPrice = new Prisma.Decimal(payload.unitPrice);

    const totalPrice = unitPrice.mul(quantity);

    // ==========================================
    // 5. Create item
    // ==========================================

    const item = await tx.invoiceItem.create({
      data: {
        invoiceId: payload.invoiceId,

        name: payload.name,

        description: payload.description,

        quantity,

        unitPrice,

        totalPrice,
      },
    });

    // ==========================================
    // 6. Recalculate invoice
    // ==========================================

    await recalculateInvoice(tx, payload.invoiceId);

    return item;
  });

  return result;
};

const getAllInvoiceItems = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId,
    },
  });

  if (!invoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  const items = await prisma.invoiceItem.findMany({
    where: {
      invoiceId,
    },
  });

  return items;
};

const getSingleInvoiceItem = async (id: string) => {
    // console.log("Fetching invoice item with ID:", id); // Debugging log
  const item = await prisma.invoiceItem.findUnique({
    where: {
      id,
    },

    include: {
      invoice: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },

          semester: true,
        },
      },
    },
  });

  if (!item) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice item not found");
  }

  return item;
};

const updateInvoiceItem = async (
  id: string,
  payload: IUpdateInvoiceItemPayload,
) => {
  const result = await prisma.$transaction(async (tx) => {
    // ==========================================
    // 1. Find item
    // ==========================================

    const item = await tx.invoiceItem.findUnique({
      where: {
        id,
      },
    });

    if (!item) {
      throw new AppError(httpStatus.NOT_FOUND, "Invoice item not found");
    }

    // ==========================================
    // 2. Find invoice
    // ==========================================

    const invoice = await tx.invoice.findUnique({
      where: {
        id: item.invoiceId,
      },
    });

    if (!invoice) {
      throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
    }

    // ==========================================
    // 3. Prevent after payment
    // ==========================================

    if (invoice.paidAmount.greaterThan(0)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invoice items cannot be modified after payment",
      );
    }

    // ==========================================
    // 4. Prevent cancelled
    // ==========================================

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cancelled invoice cannot be modified",
      );
    }

    // ==========================================
    // 5. Determine quantity
    // ==========================================

    const quantity = payload.quantity ?? item.quantity;

    // ==========================================
    // 6. Determine unit price
    // ==========================================

    const unitPrice =
      payload.unitPrice !== undefined
        ? new Prisma.Decimal(payload.unitPrice)
        : item.unitPrice;

    // ==========================================
    // 7. Calculate total price
    // ==========================================

    const totalPrice = unitPrice.mul(quantity);

    // ==========================================
    // 8. Update item
    // ==========================================

    const updatedItem = await tx.invoiceItem.update({
      where: {
        id,
      },

      data: {
        name: payload.name ?? item.name,

        description:
          payload.description !== undefined
            ? payload.description
            : item.description,

        quantity,

        unitPrice,

        totalPrice,
      },
    });

    // ==========================================
    // 9. Recalculate invoice
    // ==========================================

    await recalculateInvoice(tx, item.invoiceId);

    return updatedItem;
  });

  return result;
};

const deleteInvoiceItem = async (id: string) => {
  const result = await prisma.$transaction(async (tx) => {
    // ==========================================
    // 1. Find item
    // ==========================================

    const item = await tx.invoiceItem.findUnique({
      where: {
        id,
      },
      include: {
        invoice: true,
      },
    });

    if (!item) {
      throw new AppError(httpStatus.NOT_FOUND, "Invoice item not found");
    }

    // ==========================================
    // 2. Payment check
    // ==========================================

    if (item.invoice.paidAmount.greaterThan(0)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invoice items cannot be deleted after payment",
      );
    }

    // ==========================================
    // 3. Cancelled check
    // ==========================================

    if (item.invoice.status === InvoiceStatus.CANCELLED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cancelled invoice cannot be modified",
      );
    }

    // ==========================================
    // 4. Delete
    // ==========================================

    await tx.invoiceItem.delete({
      where: {
        id,
      },
    });

    // ==========================================
    // 5. Recalculate invoice
    // ==========================================

    await recalculateInvoice(tx, item.invoiceId);

    return null;
  });

  return result;
};

export const InvoiceItemService = {
  createInvoiceItem,

  getAllInvoiceItems,

  getSingleInvoiceItem,

  updateInvoiceItem,

  deleteInvoiceItem,
};
