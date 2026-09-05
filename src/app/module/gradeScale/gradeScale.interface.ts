export interface ICreateGradeScalePayload {
  name: string;
  description?: string;
}

export interface IUpdateGradeScalePayload {
  name?: string;
  description?: string;
}
