import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { PaymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";

const createBkashPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.createBkashPayment(req.body);

  sendResponse(res, {
    statusCode: 200,

    success: true,

    message: "bKash payment created successfully",

    data: result,
  });
});

const bkashPaymentCallback = catchAsync(async (req: Request, res: Response) => {
  const { paymentID, status } = req.query;

  const result = await PaymentService.bkashPaymentCallback(
    paymentID as string,
    status as string,
  );

  return res.redirect(result.redirectURL);
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await PaymentService.getMyPayments(
    userId as string,
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My payments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getAllPayments(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All payments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  const paymentId = req.params.paymentId;
  const result = await PaymentService.getSinglePayment(
    paymentId as string,
    userId as string,
    role as Role,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,

    success: true,

    message: "Payment retrieved successfully",

    data: result,
  });
});

export const PaymentController = {
  createBkashPayment,
  bkashPaymentCallback,
  getMyPayments,
  getAllPayments,
  getSinglePayment,
};
