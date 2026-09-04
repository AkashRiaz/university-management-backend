import { ApplicationStatus } from "../../../generated/prisma/enums";

export interface ICreateStudentScholarshipPayload {
  studentId: string;
  scholarshipId: string;
  semesterId: string;
  status?: ApplicationStatus;
}

export interface IUpdateStudentScholarshipPayload {
  semesterId?: string | null;
  status?: ApplicationStatus;
}
