import { CourseLevel, CourseType } from "../../../generated/prisma/enums";

export interface ICreateCoursePayload {
  code: string;
  title: string;
  description?: string;
  credit: number;
  courseType: CourseType;
  courseLevel: CourseLevel;
  departmentId: string;
}

export interface IUpdateCoursePayload {
  code?: string;
  title?: string;
  description?: string;
  credit?: number;
  courseType?: CourseType;
  courseLevel?: CourseLevel;
  departmentId?: string;
}