import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { ProgramService } from "./program.service";

const createProgram = catchAsync(async(req:Request, res:Response)=>{
    const program = await ProgramService.createProgram(req.body);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Program created successfully",
        data: program,
    })
})

export const ProgramController = {
    createProgram,
}