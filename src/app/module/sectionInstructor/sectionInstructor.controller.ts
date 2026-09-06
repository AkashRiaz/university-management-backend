import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { SectionInstructorService } from "./sectionInstructor.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createSectionInstructor = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SectionInstructorService.createSectionInstructor(
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Instructor assigned to section successfully",
      data: result,
    });
  },
);

const getAllSectionInstructors = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SectionInstructorService.getAllSectionInstructors();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Section instructors retrieved successfully",
      data: result,
    });
  },
);

const getSectionInstructorsBySection = catchAsync(
  async (req: Request, res: Response) => {
    const { sectionId } = req.params;

    const result =
      await SectionInstructorService.getSectionInstructorsBySection(
        sectionId as string,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Section instructors retrieved successfully",
      data: result,
    });
  },
);

const getInstructorSections = catchAsync(
  async (req: Request, res: Response) => {
    const { instructorId } = req.params;

    const result = await SectionInstructorService.getInstructorSections(
      instructorId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Instructor sections retrieved successfully",
      data: result,
    });
  },
);

const getSectionInstructorById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await SectionInstructorService.getSectionInstructorById(
      id as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Section instructor retrieved successfully",
      data: result,
    });
  },
);

const getMyInstructorSections = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const result = await SectionInstructorService.getMyInstructorSections(
      userId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Your assigned sections retrieved successfully",
      data: result,
    });
  },
);

const updateSectionInstructor = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await SectionInstructorService.updateSectionInstructor(
      id as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Section instructor updated successfully",
      data: result,
    });
  },
);

const deleteSectionInstructor = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await SectionInstructorService.deleteSectionInstructor(
      id as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Instructor removed from section successfully",
      data: result,
    });
  },
);

export const SectionInstructorController = {
  createSectionInstructor,
  getAllSectionInstructors,
  getSectionInstructorsBySection,
  getInstructorSections,
  getSectionInstructorById,
  getMyInstructorSections,
  updateSectionInstructor,
  deleteSectionInstructor,
};
