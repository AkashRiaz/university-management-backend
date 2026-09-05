import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

export const calculateInvoiceTotals = ({
  subtotal,
  discount,
  tax,
}: {
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  tax: Prisma.Decimal;
}) => {
  if (discount.lessThan(0)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Discount cannot be negative");
  }

  if (tax.lessThan(0)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Tax cannot be negative");
  }

  if (discount.greaterThan(subtotal)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Discount cannot be greater than subtotal",
    );
  }

  const total = subtotal.minus(discount).plus(tax);

  if (total.lessThan(0)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invoice total cannot be negative",
    );
  }

  const dueAmount = total;

  return {
    subtotal,
    discount,
    tax,
    total,
    dueAmount,
  };
};

export const generateInvoiceNumber = () => {
  const timestamp = Date.now();

  const random = Math.floor(1000 + Math.random() * 9000);

  return `INV-${timestamp}-${random}`;
};
