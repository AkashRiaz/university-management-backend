export interface ICreateAcademicYearPayload {
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface IUpdateAcademicYearPayload {
  name?: string;
  startDate?: Date;
  endDate?: Date;
}