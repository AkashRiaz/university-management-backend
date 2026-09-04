import { SectionStatus } from "../../../generated/prisma/enums";

export interface ICreateSectionPayload {
  name: string;
  capacity: number;
  status?: SectionStatus;
  courseId: string;
  semesterId: string;
  departmentId: string;
  roomId?: string;
}

export interface IUpdateSectionPayload {
  name?: string;
  capacity?: number;
  status?: SectionStatus;
  courseId?: string;
  semesterId?: string;
  departmentId?: string;
  roomId?: string | null;
}
