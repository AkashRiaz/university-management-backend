import { Request, Response } from "express";
import { FeeStructureItemService } from "./feeStructureItem.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";

const createFeeStructureItem = catchAsync(
  async (req: Request, res: Response) => {
    const result = await FeeStructureItemService.createFeeStructureItem(
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Fee structure item created successfully",
      data: result,
    });
  },
);

const getAllFeeStructureItems = catchAsync(
  async (req: Request, res: Response) => {
    const result = await FeeStructureItemService.getAllFeeStructureItems(
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,

      success: true,

      message: "Fee structure items retrieved successfully",

      data: result.data,

      meta: result.meta,
    });
  },
);

const getFeeStructureItemById = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await FeeStructureItemService.getFeeStructureItemById(
      id as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,

      success: true,

      message: "Fee structure item retrieved successfully",

      data: result,
    });
  },
);

const getItemsByFeeStructure = catchAsync(
  async (req: Request, res: Response) => {
    const feeStructureId = req.params.feeStructureId;
    const query = req.query;
    const result = await FeeStructureItemService.getItemsByFeeStructure(
      feeStructureId as string,
      query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,

      success: true,

      message: "Fee structure items retrieved successfully",

      data: result.data,

      meta: result.meta,
    });
  },
);

const updateFeeStructureItem = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const payload = req.body;
    const result = await FeeStructureItemService.updateFeeStructureItem(
      id as string,
      payload,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Fee structure item updated successfully",
      data: result,
    });
  },
);

const deleteFeeStructureItem = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    await FeeStructureItemService.deleteFeeStructureItem(id as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,

      success: true,

      message: "Fee structure item deleted successfully",

      data: null,
    });
  },
);

export const FeeStructureItemController = {
  createFeeStructureItem,
  getAllFeeStructureItems,
  getFeeStructureItemById,
  getItemsByFeeStructure,
  updateFeeStructureItem,
  deleteFeeStructureItem,
};
