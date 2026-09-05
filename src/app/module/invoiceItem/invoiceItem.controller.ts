import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { InvoiceItemService } from "./invoiceItem.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createInvoiceItem = catchAsync(async (req: Request, res: Response) => {
  const result = await InvoiceItemService.createInvoiceItem(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,

    success: true,

    message: "Invoice item created successfully",

    data: result,
  });
});

const getAllInvoiceItems = catchAsync(async (req: Request, res: Response) => {
  const invoiceId = req.params.invoiceId;
  const result = await InvoiceItemService.getAllInvoiceItems(
    invoiceId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,

    success: true,

    message: "Invoice items retrieved successfully",

    data: result,
  });
});

const getSingleInvoiceItem = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await InvoiceItemService.getSingleInvoiceItem(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,

    success: true,

    message: "Invoice item retrieved successfully",

    data: result,
  });
});

const updateInvoiceItem = catchAsync(async (req: Request, res: Response) => {
  const result = await InvoiceItemService.updateInvoiceItem(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,

    success: true,

    message: "Invoice item updated successfully",

    data: result,
  });
});

const deleteInvoiceItem = catchAsync(async (req: Request, res: Response) => {
  await InvoiceItemService.deleteInvoiceItem(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,

    success: true,

    message: "Invoice item deleted successfully",

    data: null,
  });
});

export const InvoiceItemController = {
  createInvoiceItem,

  getAllInvoiceItems,

  getSingleInvoiceItem,

  updateInvoiceItem,

  deleteInvoiceItem,
};
