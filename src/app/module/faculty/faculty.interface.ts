export interface ICreateFacultyPayload {
  name: string;
  code: string;
  description?: string;
}

export interface IUpdateFacultyPayload {
  name?: string;
  code?: string;
  description?: string;
}