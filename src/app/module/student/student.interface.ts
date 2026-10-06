import { Gender } from "../../../generated/prisma/enums";
export interface ICreateStudentPayload {
  name: string;
  email: string;
  departmentId: string;
  programId: string;
  admissionDate: Date;
  admissionYear: number;
  gender?: Gender;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface IResendStudentOtpPayload {
  email: string;
}

export interface IUpdateStudentSelfPayload {
  name?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface IUpdateStudentAdminPayload {
  name?: string;
  email?: string;
  departmentId?: string;
  programId?: string;
  admissionDate?: Date;
  admissionYear?: number;
  currentSemesterNumber?: number;
  status?: string;
  academicStatus?: string;
}
