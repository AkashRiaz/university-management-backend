import { Gender } from "../../../generated/prisma/enums";

export interface ICreateStudentPayload {
  // User fields
  name: string;
  email: string;

  // StudentProfile fields
  departmentId: string;
//   programId: string;
  admissionDate: Date;
  admissionYear: number;
  gender?: Gender;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}