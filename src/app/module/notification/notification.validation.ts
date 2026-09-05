import { NotificationChannel, NotificationStatus, NotificationType } from "../../../generated/prisma/enums";


export interface ICreateNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  // status defaults to PENDING in the schema, but allow override
  // (e.g. a caller pre-marks something SENT for an external channel)
  status?: NotificationStatus;
}

export interface IUpdateNotificationPayload {
  title?: string;
  message?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  // setting this true stamps readAt = now(); there's no "un-read"
  isRead?: boolean;
}
