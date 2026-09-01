export interface ICreateDepartmentPayload {
  name: string;
  code: string;
  description?: string;
  building?: string;
  phone?: string;
  email?: string;
  facultyId: string;
}

export interface IUpdateDepartmentPayload {
  name?: string;
  code?: string;
  description?: string;
  building?: string;
  phone?: string;
  email?: string;
  facultyId?: string;
}

