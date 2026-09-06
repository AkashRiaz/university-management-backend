export interface ICreateAttendanceSessionPayload {
  sectionId: string;
  date: Date;
  topic?: string;
}

export interface IUpdateAttendanceSessionPayload {
  date?: Date;
  topic?: string;
}
