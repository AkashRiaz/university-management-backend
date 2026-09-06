import { RegistrationStatus } from "../../../generated/prisma/enums";

export interface ICreateRegistrationPayload {
  semesterId: string;
}

export interface IUpdateRegistrationPayload {
  status: RegistrationStatus;
}