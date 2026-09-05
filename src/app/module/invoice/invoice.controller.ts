import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { InvoiceService } from "./invoice.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createInvoice = catchAsync(async (req: Request, res: Response) => {
  const result = await InvoiceService.createInvoice(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Invoice created successfully",
    data: result,
  });
});

const getAllInvoices = catchAsync(async (req: Request, res: Response) => {
  const result = await InvoiceService.getAllInvoices(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoices retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleInvoice = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await InvoiceService.getSingleInvoice(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice retrieved successfully",
    data: result,
  });
});

const updateInvoice = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body;
  const result = await InvoiceService.updateInvoice(id as string, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice updated successfully",
    data: result,
  });
});

const deleteInvoice = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await InvoiceService.deleteInvoice(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice deleted successfully",
    data: null,
  });
});

export const InvoiceController = {
  createInvoice,
  getAllInvoices,
  getSingleInvoice,
  updateInvoice,
  deleteInvoice,
};
