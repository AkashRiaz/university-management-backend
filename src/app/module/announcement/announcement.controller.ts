import { Request, Response } from "express";
import { AnnouncementService } from "./announcement.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";

const createAnnouncement = catchAsync(async (req: Request, res: Response) => {
  const result = await AnnouncementService.createAnnouncement(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Announcement created successfully",
    data: result,
  });
});

const getAllAnnouncements = catchAsync(async (req: Request, res: Response) => {
  const result = await AnnouncementService.getAllAnnouncements(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Announcements retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getAnnouncementById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await AnnouncementService.getAnnouncementById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Announcement retrieved successfully",
    data: result,
  });
});

const getPublishedAnnouncements = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AnnouncementService.getPublishedAnnouncements(
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Published announcements retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const updateAnnouncement = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await AnnouncementService.updateAnnouncement(
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Announcement updated successfully",
    data: result,
  });
});

const deleteAnnouncement = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await AnnouncementService.deleteAnnouncement(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Announcement deleted successfully",
    data: null,
  });
});

export const AnnouncementController = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  getPublishedAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
};
