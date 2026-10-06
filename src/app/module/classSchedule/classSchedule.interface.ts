export interface ICreateClassSchedulePayload {
  dayOfWeek: number | number[];
  startTime: string;
  endTime: string;
  sectionId: string;
  roomId?: string;
  departmentId: string;
}

export interface IUpdateClassSchedulePayload {
  dayOfWeek?: number | number[];
  startTime?: string;
  endTime?: string;
  sectionId?: string;
  roomId?: string | null;
  departmentId?: string;
}
