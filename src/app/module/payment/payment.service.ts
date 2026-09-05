import { Prisma } from "../../../generated/prisma/client";
import {
  InvoiceStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  Role,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateBkashPaymentPayload } from "./payment.interface";
import httpStatus from "http-status";
import {
  generatePaymentTransactionId,
  parseBkashPaymentDate,
} from "./payment.utils";
import { getBkashIdToken } from "../../lib/bkash";
import { config } from "../../config";
import axios from "axios";
import { IQuery } from "../../interfaces";

const createBkashPayment = async (payload: ICreateBkashPaymentPayload) => {
  //    * Find invoice
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: payload.invoiceId,
    },
    include: {
      student: {
        include: {
          user: true,
        },
      },
      semester: true,
      items: true,
    },
  });

  if (!invoice) {
    throw new AppError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  //   * Check invoice status

  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cancelled invoice cannot be paid",
    );
  }

  if (invoice.status === InvoiceStatus.PAID) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invoice is already fully paid");
  }

  //    * Check due amount
  const dueAmount = new Prisma.Decimal(invoice.dueAmount);

  if (dueAmount.lessThanOrEqualTo(0)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invoice has no due amount");
  }

  //    * Check existing pending payment

  const existingPayment = await prisma.payment.findFirst({
    where: {
      invoiceId: invoice.id,
      gateway: PaymentGateway.BKASH,
      status: {
        in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
      },
    },
  });

  if (existingPayment) {
    throw new AppError(
      httpStatus.CONFLICT,
      "A bKash payment is already in progress for this invoice",
    );
  }

  //    * Generate university transaction ID
  const transactionId = generatePaymentTransactionId();

  //    * Create Payment PENDING

  const payment = await prisma.payment.create({
    data: {
      transactionId,
      studentId: invoice.studentId,
      invoiceId: invoice.id,
      amount: dueAmount,
      gateway: PaymentGateway.BKASH,
      method: PaymentMethod.MOBILE_BANKING,
      status: PaymentStatus.PENDING,
    },
  });

  try {
    //  * Get bKash ID token

    const idToken = await getBkashIdToken();

    /*
     * Callback URL
     */

    const callbackURL = `${config.bkash_callback_url}/payments/bkash/callback`;

    /*
     * Create bKash checkout
     */
    const response = await axios.post(
      `${config.bkash_base_url}/tokenized/checkout/create`,
      {
        mode: "0011",
        payerReference: invoice.student.user.email,
        callbackURL,
        amount: dueAmount.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: payment.transactionId,
      },
      {
        headers: {
          Authorization: idToken,
          "X-App-Key": config.bkash_app_key,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    const bkashResult = response.data;

    /*
     * Validate bKash response
     */

    if (!bkashResult.paymentID || !bkashResult.bkashURL) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: PaymentStatus.FAILED,
          metadata: bkashResult,
        },
      });

      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "Failed to create bKash payment",
      );
    }

    /*
     * Save bKash payment information
     * ========================================
     *
     * gatewayReference will temporarily contain
     * bKash paymentID.
     *
     * Later, after execute, we can save trxID
     * in metadata or introduce a dedicated
     * gatewayPaymentId field.
     */

    await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: PaymentStatus.PROCESSING,
        gatewayReference: bkashResult.paymentID,
        metadata: bkashResult,
      },
    });

    /*
     * Return checkout URL
     */

    return {
      paymentId: payment.id,
      transactionId: payment.transactionId,
      paymentURL: bkashResult.bkashURL,
      amount: dueAmount.toString(),
      bkashPaymentId: bkashResult.paymentID,
    };
  } catch (error) {
    /*
     * bKash API failure
     */

    await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: PaymentStatus.FAILED,

        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Unable to create bKash payment",
    );
  }
};

const bkashPaymentCallback = async (paymentID: string, status?: string) => {
  if (!paymentID) {
    throw new AppError(httpStatus.BAD_REQUEST, "bKash payment ID is required");
  }

  const idToken = await getBkashIdToken();

  /*
   * ==========================================
   * Execute bKash payment
   * ==========================================
   */

  const response = await axios.post(
    `${config.bkash_base_url}/tokenized/checkout/execute`,

    {
      paymentID,
    },

    {
      headers: {
        Authorization: idToken,
        "X-App-Key": config.bkash_app_key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  const result = response.data;

  /*
   * ==========================================
   * Check bKash response
   * ==========================================
   */

  if (
    result.statusCode === "0000" &&
    result.transactionStatus === "Completed"
  ) {
    return completeBkashPayment(paymentID, result);
  }

  if (status === "cancel") {
    await prisma.payment.updateMany({
      where: {
        gateway: PaymentGateway.BKASH,

        gatewayReference: paymentID,

        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
        },
      },

      data: {
        status: PaymentStatus.CANCELLED,

        metadata: result,
      },
    });

    return {
      success: false,
      status: "cancelled",
      redirectURL: `${config.frontend_url}/payment/cancel`,
    };
  }

  await prisma.payment.updateMany({
    where: {
      gateway: PaymentGateway.BKASH,
      gatewayReference: paymentID,
      status: {
        in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
      },
    },

    data: {
      status: PaymentStatus.FAILED,
      metadata: result,
    },
  });

  return {
    success: false,
    status: "failed",
    redirectURL: `${config.frontend_url}/payment/failed`,
  };
};

const completeBkashPayment = async (paymentID: string, bkashResult: any) => {
  return prisma.$transaction(async (tx) => {
    /*
     * Find payment
     */

    const payment = await tx.payment.findFirst({
      where: {
        gateway: PaymentGateway.BKASH,
        gatewayReference: paymentID,
      },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    /*
     * Idempotency
     */

    if (payment.status === PaymentStatus.COMPLETED) {
      return {
        success: true,
        status: "completed",
        redirectURL: `${config.frontend_url}/payment/success`,
      };
    }

    /*
     * Prevent invalid states
     */

    if (
      payment.status === PaymentStatus.CANCELLED ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment cannot be completed");
    }

    const invoice = payment.invoice;

    /*
     * Verify amount
     */

    const paymentAmount = new Prisma.Decimal(payment.amount);

    const bkashAmount = new Prisma.Decimal(bkashResult.amount);

    if (!paymentAmount.equals(bkashAmount)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment amount does not match bKash amount",
      );
    }

    /*
     * Calculate paid amount
     */

    const currentPaidAmount = new Prisma.Decimal(invoice.paidAmount);

    const invoiceTotal = new Prisma.Decimal(invoice.total);

    const newPaidAmount = currentPaidAmount.add(paymentAmount);

    /*
     * Prevent overpayment
     */

    if (newPaidAmount.greaterThan(invoiceTotal)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment exceeds invoice total",
      );
    }

    /*
     * Calculate due
     */

    const newDueAmount = invoiceTotal.sub(newPaidAmount);

    const invoiceStatus = newDueAmount.equals(0)
      ? InvoiceStatus.PAID
      : InvoiceStatus.PARTIALLY_PAID;

    /*
     * Update Payment
     */

    await tx.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: PaymentStatus.COMPLETED,
        metadata: bkashResult,
        paidAt: parseBkashPaymentDate(bkashResult.paymentExecuteTime),
      },
    });

    /*
     * Update Invoice
     */

    await tx.invoice.update({
      where: {
        id: invoice.id,
      },

      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status: invoiceStatus,
      },
    });

    return {
      success: true,
      status: "completed",
      invoiceId: invoice.id,
      paymentId: payment.id,
      transactionId: payment.transactionId,
      amount: paymentAmount.toString(),
      paidAmount: newPaidAmount.toString(),
      dueAmount: newDueAmount.toString(),
      redirectURL: `${config.frontend_url}/payment/success`,
    };
  });
};

const getMyPayments = async (userId: string, query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;
  const page = query.page ? parseInt(query.page) : 1;
  const skip = (page - 1) * limit;

  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new AppError(httpStatus.NOT_FOUND, "Student profile not found");
  }

  const allowedSortFields = [
    "amount",
    "status",
    "gateway",
    "transactionId",
    "paidAt",
    "createdAt",
    "updatedAt",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: Prisma.PaymentWhereInput[] = [
    {
      studentId: student.id,
    },
  ];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          transactionId: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          gatewayReference: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          invoice: {
            invoiceNumber: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (query.status) {
    andConditions.push({
      status: query.status as PaymentStatus,
    });
  }

  if (query.gateway) {
    andConditions.push({
      gateway: query.gateway as PaymentGateway,
    });
  }

  const payments = await prisma.payment.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      invoice: {
        include: {
          semester: true,
          items: true,
        },
      },
    },
  });

  const total = await prisma.payment.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: payments,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAllPayments = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "amount",
    "gateway",
    "method",
    "status",
    "transactionId",
    "paidAt",
    "createdAt",
    "updatedAt",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: Prisma.PaymentWhereInput[] = [];

  /*
   * Search
   */

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          transactionId: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },

        {
          gatewayReference: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },

        {
          invoice: {
            invoiceNumber: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },

        {
          student: {
            studentId: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
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

  /*
   * Filters
   */

  if (query.studentId) {
    andConditions.push({
      studentId: query.studentId,
    });
  }

  if (query.invoiceId) {
    andConditions.push({
      invoiceId: query.invoiceId,
    });
  }

  if (query.gateway) {
    andConditions.push({
      gateway: query.gateway as PaymentGateway,
    });
  }

  if (query.method) {
    andConditions.push({
      method: query.method as PaymentMethod,
    });
  }

  if (query.status) {
    andConditions.push({
      status: query.status as PaymentStatus,
    });
  }

  /*
   * Get payments
   */

  const payments = await prisma.payment.findMany({
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

          department: true,

          program: true,
        },
      },

      invoice: {
        include: {
          semester: true,

          items: true,
        },
      },
    },
  });

  /*
   * Total
   */

  const total = await prisma.payment.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: payments,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSinglePayment = async (
  paymentId: string,
  userId: string,
  role: Role,
) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },

    include: {
      student: {
        include: {
          user: {
            omit: {
              password: true,
            },
          },

          department: true,

          program: true,
        },
      },

      invoice: {
        include: {
          semester: true,

          feeStructure: true,

          items: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  /*
   * Student can only see
   * their own payment
   */

  if (role === Role.STUDENT && payment.student.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view this payment",
    );
  }

  return payment;
};

export const PaymentService = {
  createBkashPayment,
  bkashPaymentCallback,
  completeBkashPayment,
  getMyPayments,
  getAllPayments,
  getSinglePayment,
};
