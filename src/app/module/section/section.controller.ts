import { Request, Response } from "express";
import { SectionService } from "./section.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";

const createSection = catchAsync(async (req: Request, res: Response) => {
  const result = await SectionService.createSection(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Section created successfully",
    data: result,
  });
});

const getAllSections = catchAsync(async (req: Request, res: Response) => {
  const result = await SectionService.getAllSections(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sections retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSectionById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await SectionService.getSectionById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Section retrieved successfully",
    data: result,
  });
});

const getSectionsBySemester = catchAsync(
  async (req: Request, res: Response) => {
    const { semesterId } = req.params;

    const result = await SectionService.getSectionsBySemester(
      semesterId as string,
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Sections retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);

const getSectionsByCourse = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;

  const result = await SectionService.getSectionsByCourse(
    courseId as string,
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sections retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateSection = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await SectionService.updateSection(id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Section updated successfully",
    data: result,
  });
});

const deleteSection = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await SectionService.deleteSection(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Section deleted successfully",
    data: null,
  });
});

export const SectionController = {
  createSection,
  getAllSections,
  getSectionById,
  getSectionsBySemester,
  getSectionsByCourse,
  updateSection,
  deleteSection,
};
