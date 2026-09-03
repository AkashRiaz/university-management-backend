export interface ICreateProgramCoursePayload {
  programId: string;
  courseId: string;
  semesterNumber: number;
  isRequired?: boolean;
}

export interface IUpdateProgramCoursePayload {
  programId?: string;
  courseId?: string;
  semesterNumber?: number;
  isRequired?: boolean;
}
