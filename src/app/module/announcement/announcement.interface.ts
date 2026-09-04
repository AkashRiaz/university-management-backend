export interface ICreateAnnouncementPayload {
  title: string;
  content: string;
  isPublished?: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
}

export interface IUpdateAnnouncementPayload {
  title?: string;
  content?: string;
  isPublished?: boolean;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
}
