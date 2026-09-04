import {
  ScholarshipStatus,
  ScholarshipType,
} from "../../../generated/prisma/enums";

export interface ICreateScholarshipPayload {
  name: string;
  type: ScholarshipType;
  percentage?: number;
  fixedAmount?: number;
  description?: string;
  status?: ScholarshipStatus;
}

export interface IUpdateScholarshipPayload {
  name?: string;
  type?: ScholarshipType;
  percentage?: number | null;
  fixedAmount?: number | null;
  description?: string | null;
  status?: ScholarshipStatus;
}
