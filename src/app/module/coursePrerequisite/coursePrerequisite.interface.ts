export interface ICreateCoursePrerequisitePayload {
  courseId: string;
  prerequisiteCourseId: string;
  minimumGrade?: string;
}

export interface IUpdateCoursePrerequisitePayload {
  courseId?: string;
  prerequisiteCourseId?: string;
  minimumGrade?: string;
}