import { SemesterStatus, SemesterType } from "../../../generated/prisma/enums";

export interface ICreateSemesterPayload {
  name: SemesterType;

  startDate: Date;

  endDate: Date;

  registrationStart: Date;

  registrationEnd: Date;

  status?: SemesterStatus;

  academicYearId: string;
}

export interface IUpdateSemesterPayload {
  name?: SemesterType;

  startDate?: Date;

  endDate?: Date;

  registrationStart?: Date;

  registrationEnd?: Date;

  status?: SemesterStatus;

  academicYearId?: string;
}