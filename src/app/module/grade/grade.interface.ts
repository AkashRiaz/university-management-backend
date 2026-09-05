import { GradeType } from "../../../generated/prisma/enums";

export interface ICreateGradePayload {
  letter: string;
  minMarks: number;
  maxMarks: number;
  gradePoint: number;
  type: GradeType;
  gradeScaleId: string;
}

export interface IUpdateGradePayload {
  letter?: string;
  minMarks?: number;
  maxMarks?: number;
  gradePoint?: number;
  type?: GradeType;
}
