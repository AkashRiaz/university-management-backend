export interface ICreateSectionInstructorPayload {
  sectionId: string;
  instructorId: string;
  isPrimary?: boolean;
}

export interface IUpdateSectionInstructorPayload {
  isPrimary?: boolean;
}
