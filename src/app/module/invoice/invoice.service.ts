import { Prisma } from "../../../generated/prisma/client";
import {
  ApplicationStatus,
  InvoiceStatus,
} from "../../../generated/prisma/enums";
import { InvoiceWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateInvoicePayload,
  IUpdateInvoicePayload,
} from "./invoice.interface";
import httpStatus from "http-status";
import { calculateInvoiceTotals, generateInvoiceNumber } from "./invoice.utils";

const createInvoice = async (payload: ICreateInvoicePayload) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Find student

    const student = await tx.studentProfile.findUnique({
      where: {
        id: payload.studentId,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        program: true,

        department: true,
      },
    });

    if (!student) {
      throw new AppError(httpStatus.NOT_FOUND, "Student not found");
    }

    if (!student.programId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Student is not assigned to any program",
      );
    }

    // ==========================================
    // 2. Find semester
    // ==========================================

    const semester = await tx.semester.findUnique({
      where: {
        id: payload.semesterId,
      },
    });

    if (!semester) {
      throw new AppError(httpStatus.NOT_FOUND, "Semester not found");
    }

    // ==========================================
    // 3. Prevent duplicate active invoice
    // ==========================================

    const existingInvoice = await tx.invoice.findFirst({
      where: {
        studentId: payload.studentId,

        semesterId: payload.semesterId,

        status: {
          not: InvoiceStatus.CANCELLED,
        },
      },
    });

    if (existingInvoice) {
      throw new AppError(
        httpStatus.CONFLICT,
        "An active invoice already exists for this student and semester",
      );
    }

    // 4. Find FeeStructure

    const feeStructure = await tx.feeStructure.findFirst({
      where: {
        programId: student.programId,

        semesterId: payload.semesterId,
      },

      include: {
        items: true,
      },
    });

    if (!feeStructure) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Fee structure not found for this student's program and semester",
      );
    }

    // ==========================================
    // 5. Make sure FeeStructure has items
    // ==========================================

    if (feeStructure.items.length === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Fee structure has no fee items",
      );
    }

    // ==========================================
    // 6. Calculate subtotal
    // ==========================================

    const subtotal = feeStructure.items.reduce(
      (total: Prisma.Decimal, item) => {
        return total.plus(item.amount);
      },

      new Prisma.Decimal(0),
    );

    // ==========================================
    // 7. Find approved scholarships
    // ==========================================

    const studentScholarships = await tx.studentScholarship.findMany({
      where: {
        studentId: payload.studentId,
        status: ApplicationStatus.APPROVED,
        semesterId: payload.semesterId,
      },
    });

    // ==========================================
    // 8. Calculate scholarship discount
    // ==========================================

    const scholarshipDiscount = studentScholarships.reduce(
      (total: Prisma.Decimal, scholarship) => {
        return total.plus(scholarship.amount);
      },
      new Prisma.Decimal(0),
    );

    // 9. Manual discount

    const manualDiscount = new Prisma.Decimal(payload.discount ?? 0);

    // ==========================================
    // 10. Total discount
    // ==========================================

    let totalDiscount = scholarshipDiscount.plus(manualDiscount);

    // Never allow discount > subtotal

    if (totalDiscount.greaterThan(subtotal)) {
      totalDiscount = subtotal;
    }

    // ==========================================
    // 11. Tax
    // ==========================================

    const tax = new Prisma.Decimal(payload.tax ?? 0);

    // ==========================================
    // 12. Calculate invoice totals
    // ==========================================

    const totals = calculateInvoiceTotals({
      subtotal,

      discount: totalDiscount,

      tax,
    });

    // ==========================================
    // 13. Generate invoice number
    // ==========================================

    const invoiceNumber = generateInvoiceNumber();

    // ==========================================
    // 14. Create invoice + items
    // ==========================================

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,

        studentId: payload.studentId,

        semesterId: payload.semesterId,

        feeStructureId: feeStructure.id,

        subtotal: totals.subtotal,

        discount: totals.discount,

        tax: totals.tax,

        total: totals.total,

        paidAmount: new Prisma.Decimal(0),

        dueAmount: totals.dueAmount,

        dueDate: payload.dueDate,

        status: InvoiceStatus.ISSUED,

        // ======================================
        // Automatically create InvoiceItems
        // ======================================

        items: {
          create: feeStructure.items.map((item) => ({
            name: item.name,

            description: item.description,

            quantity: 1,

            unitPrice: item.amount,

            totalPrice: item.amount,
          })),
        },
      },

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

            program: true,

            department: true,
          },
        },

        semester: true,

        feeStructure: {
          include: {
            items: true,
          },
        },

        items: true,

        payments: true,
      },
    });

    return invoice;
  });

  return result;
};

const getAllInvoices = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "invoiceNumber",
    "subtotal",
    "scholarshipAmount",
    "totalAmount",
    "dueDate",
    "status",
    "createdAt",
    "updatedAt",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: InvoiceWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          invoiceNumber: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          student: {
            user: {
              name: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
        {
          student: {
            user: {
              email: {
                contains: query.searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  if (query.studentId) {
    andConditions.push({
      studentId: query.studentId,
    });
  }

  if (query.semesterId) {
    andConditions.push({
      semesterId: query.semesterId,
    });
  }

  if (query.status) {
    andConditions.push({
      status: query.status,
    });
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      student: {
        include: {
          user: {
            omit: {
              password: true,
            },
          },

          program: true,

          department: true,
        },
      },

      semester: true,

      feeStructure: true,

      items: true,

      payments: true,
    },
  });

  const total = await prisma.invoice.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: invoices,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleInvoice = async (id: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id,
    },

    include: {
      student: {
        include: {
          user: {
            omit: {
              password: true,
            },
          },

          program: true,

          department: true,
        },
      },

      semester: true,

      feeStructure: {
        include: {
          items: true,
        },
      },

      items: true,

      payments: true,
    },
  });

  if (!invoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  return invoice;
};

const updateInvoice = async (id: string, payload: IUpdateInvoicePayload) => {
  const result = await prisma.$transaction(async (tx) => {
    // ==========================================
    // 1. Find invoice
    // ==========================================

    const invoice = await tx.invoice.findUnique({
      where: {
        id,
      },
    });

    if (!invoice) {
      throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
    }

    // ==========================================
    // 2. Cannot update cancelled
    // ==========================================

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cancelled invoice cannot be updated",
      );
    }

    // ==========================================
    // 3. Cannot update paid invoice
    // ==========================================

    if (invoice.status === InvoiceStatus.PAID) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Paid invoice cannot be updated",
      );
    }

    // ==========================================
    // 4. If payment exists
    // ==========================================

    const hasPayment = invoice.paidAmount.greaterThan(0);

    if (
      hasPayment &&
      (payload.discount !== undefined || payload.tax !== undefined)
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Discount and tax cannot be changed after payment",
      );
    }

    // ==========================================
    // 5. Calculate discount
    // ==========================================

    const discount =
      payload.discount !== undefined
        ? new Prisma.Decimal(payload.discount)
        : invoice.discount;

    // ==========================================
    // 6. Calculate tax
    // ==========================================

    const tax =
      payload.tax !== undefined ? new Prisma.Decimal(payload.tax) : invoice.tax;

    // ==========================================
    // 7. Calculate total
    // ==========================================

    const totals = calculateInvoiceTotals({
      subtotal: invoice.subtotal,

      discount,

      tax,
    });

    // ==========================================
    // 8. Consider already paid amount
    // ==========================================

    const dueAmount = totals.total.minus(invoice.paidAmount);

    if (dueAmount.lessThan(0)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invoice total cannot be less than paid amount",
      );
    }

    // ==========================================
    // 9. Determine status
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
    // 10. Update
    // ==========================================

    const updatedInvoice = await tx.invoice.update({
      where: {
        id,
      },

      data: {
        dueDate: payload.dueDate ?? invoice.dueDate,

        discount,

        tax,

        total: totals.total,

        dueAmount,

        status,
      },

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

            program: true,

            department: true,
          },
        },

        semester: true,

        feeStructure: true,

        items: true,

        payments: true,
      },
    });

    return updatedInvoice;
  });

  return result;
};

const deleteInvoice = async (id: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id,
    },

    include: {
      payments: true,
    },
  });

  if (!invoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  // ==========================================
  // Payment history exists
  // ==========================================

  if (invoice.payments.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invoice cannot be deleted because payment history exists",
    );
  }

  // ==========================================
  // Delete
  // ==========================================

  await prisma.invoice.delete({
    where: {
      id,
    },
  });

  return null;
};

export const InvoiceService = {
  createInvoice,
  getAllInvoices,
  getSingleInvoice,
  updateInvoice,
  deleteInvoice,
};
