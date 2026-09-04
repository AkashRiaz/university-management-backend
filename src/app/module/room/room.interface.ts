export interface ICreateRoomPayload {
  building: string;
  roomNumber: string;
  capacity: number;
}

export interface IUpdateRoomPayload {
  building?: string;
  roomNumber?: string;
  capacity?: number;
}