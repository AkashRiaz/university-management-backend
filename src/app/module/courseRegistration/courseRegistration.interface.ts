import { CourseRegistrationStatus } from "../../../generated/prisma/enums";

export interface ICreateCourseRegistrationPayload {
  registrationId: string;
  sectionId: string;
}

export interface IUpdateCourseRegistrationPayload {
  status: CourseRegistrationStatus;
}