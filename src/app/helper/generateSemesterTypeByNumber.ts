import { SemesterType } from "../../generated/prisma/enums";

export const getSemesterTypeByNumber = (
  semesterNumber: number,
): SemesterType => {
  if (semesterNumber < 1 || semesterNumber > 16) {
    throw new Error("Semester number must be between 1 and 16");
  }

  const semesterTypes: SemesterType[] = [
    SemesterType.SPRING,
    SemesterType.SUMMER,
    SemesterType.FALL,
    SemesterType.WINTER,
  ];

  return semesterTypes[(semesterNumber - 1) % 4];
};
