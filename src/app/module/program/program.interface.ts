export interface ICreateProgramPayload {
  name: string;
  code: string;
  description?: string;
  durationYears: number;
  totalCredits: number;
  departmentId: string;
}

export interface IUpdateProgramPayload {
  name?: string;
  code?: string;
  description?: string;
  durationYears?: number;
  totalCredits?: number;
  departmentId?: string;
}