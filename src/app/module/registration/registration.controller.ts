import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { RegistrationService } from "./registration.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createRegistration = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const payload = req.body;

  const result = await RegistrationService.createRegistration(
    userId as string,
    payload,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Registration created successfully",
    data: result,
  });
});

const getMyRegistrations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await RegistrationService.getMyRegistrations(
    userId as string,
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My registrations retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAllRegistrations = catchAsync(async (req: Request, res: Response) => {
  const result = await RegistrationService.getAllRegistrations(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Registrations retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleRegistration = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await RegistrationService.getSingleRegistration(
      userId as string,
      req.params.registrationId as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Registration retrieved successfully",
      data: result,
    });
  },
);

const submitRegistration = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await RegistrationService.submitRegistration(
    userId as string,
    req.params.registrationId as string,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Registration submitted successfully",
    data: result,
  });
});

const approveRegistration = catchAsync(async (req: Request, res: Response) => {
  const result = await RegistrationService.approveRegistration(
    req.params.registrationId as string,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Registration approved successfully",
    data: result,
  });
});

const rejectRegistration = catchAsync(async (req: Request, res: Response) => {
  const result = await RegistrationService.rejectRegistration(
    req.params.registrationId as string,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Registration rejected successfully",
    data: result,
  });
});

export const RegistrationController = {
  createRegistration,
  getMyRegistrations,
  getAllRegistrations,
  getSingleRegistration,
  submitRegistration,
  approveRegistration,
  rejectRegistration,
};
