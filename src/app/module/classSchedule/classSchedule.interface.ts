export interface ICreateClassSchedulePayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sectionId: string;
  roomId?: string;
  departmentId: string;
}

export interface IUpdateClassSchedulePayload {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  sectionId?: string;
  roomId?: string | null;
  departmentId?: string;
}
