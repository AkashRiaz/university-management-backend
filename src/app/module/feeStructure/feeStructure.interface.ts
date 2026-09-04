export interface ICreateFeeStructurePayload {
  name: string;
  description?: string;
  programId?: string;
  semesterId?: string;
}

export interface IUpdateFeeStructurePayload {
  name?: string;
  description?: string | null;
  programId?: string | null;
  semesterId?: string | null;
}
