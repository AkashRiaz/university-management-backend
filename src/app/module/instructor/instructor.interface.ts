import { Gender, InstructorDesignation, UserStatus } from "../../../generated/prisma/enums";

export interface ICreateInstructorPayload {
  name: string;
  email: string;

  designation: InstructorDesignation;

  specialization?: string;
  phone?: string;
  officeRoom?: string;

  joiningDate: Date;
  dateOfBirth?: Date;

  gender?: Gender;
  address?: string;
  bio?: string;
  qualification?: string;

  departmentId: string;
}

export interface IUpdateInstructorSelfPayload {
  name?: string;

  specialization?: string;
  phone?: string;
  officeRoom?: string;

  dateOfBirth?: Date;
  gender?: Gender;
  address?: string;

  bio?: string;
  qualification?: string;
}

export interface IUpdateInstructorAdminPayload {
  name?: string;

  designation?: InstructorDesignation;

  joiningDate?: Date;

  departmentId?: string;

  status?: UserStatus;
}

export interface IVerifyInstructorEmailPayload {
  email: string;
  otp: string;
}

export interface IResendInstructorOtpPayload {
  email: string;
}
