export interface ICreateFeeStructureItemPayload {
  feeStructureId: string;
  name: string;
  description?: string;
  amount: number;
}

export interface IUpdateFeeStructureItemPayload {
  name?: string;
  description?: string | null;
  amount?: number;
}
