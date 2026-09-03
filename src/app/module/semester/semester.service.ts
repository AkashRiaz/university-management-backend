import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateSemesterPayload,
  IUpdateSemesterPayload,
} from "./semester.interface";
import httpStatus from "http-status";

const createSemester = async (payload: ICreateSemesterPayload) => {
  const academicYear = await prisma.academicYear.findUnique({
    where: {
      id: payload.academicYearId,
    },
  });

  if (!academicYear) {
    throw new AppError(httpStatus.NOT_FOUND, "Academic year not found");
  }

  // Semester date validation
  if (payload.endDate <= payload.startDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Semester end date must be after start date",
    );
  }

  // Registration date validation
  if (payload.registrationEnd <= payload.registrationStart) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Registration end date must be after registration start date",
    );
  }

  // Registration must finish before semester starts
  if (payload.registrationEnd > payload.startDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Registration must end before the semester starts",
    );
  }

  // Semester must be inside academic year
  if (
    payload.startDate < academicYear.startDate ||
    payload.endDate > academicYear.endDate
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Semester dates must be within the academic year",
    );
  }

  // Check duplicate semester
  const existingSemester = await prisma.semester.findUnique({
    where: {
      academicYearId_name: {
        academicYearId: payload.academicYearId,
        name: payload.name,
      },
    },
  });

  if (existingSemester) {
    throw new AppError(
      httpStatus.CONFLICT,
      `${payload.name} semester already exists for this academic year`,
    );
  }

  const semester = await prisma.semester.create({
    data: payload,
    include: {
      academicYear: true,
    },
  });

  return semester;
};

const getAllSemesters = async () => {
  const semesters = await prisma.semester.findMany({
    include: {
      academicYear: true,
    },

    orderBy: [
      {
        academicYear: {
          startDate: "desc",
        },
      },
      {
        startDate: "asc",
      },
    ],
  });

  return semesters;
};

const getSemesterById = async (id: string) => {
  const semester = await prisma.semester.findUnique({
    where: {
      id,
    },

    include: {
      academicYear: true,
    },
  });

  if (!semester) {
    throw new AppError(httpStatus.NOT_FOUND, "Semester not found");
  }

  return semester;
};

const getSemestersByAcademicYear = async (academicYearId: string) => {
  const academicYear = await prisma.academicYear.findUnique({
    where: {
      id: academicYearId,
    },
  });

  if (!academicYear) {
    throw new AppError(httpStatus.NOT_FOUND, "Academic year not found");
  }

  const semesters = await prisma.semester.findMany({
    where: {
      academicYearId,
    },

    orderBy: {
      startDate: "asc",
    },

    include: {
      academicYear: true,
    },
  });

  return semesters;
};

const updateSemester = async (id: string, payload: IUpdateSemesterPayload) => {
  const existingSemester = await prisma.semester.findUnique({
    where: {
      id,
    },

    include: {
      academicYear: true,
    },
  });

  if (!existingSemester) {
    throw new AppError(httpStatus.NOT_FOUND, "Semester not found");
  }

  const startDate = payload.startDate ?? existingSemester.startDate;

  const endDate = payload.endDate ?? existingSemester.endDate;

  const registrationStart =
    payload.registrationStart ?? existingSemester.registrationStart;

  const registrationEnd =
    payload.registrationEnd ?? existingSemester.registrationEnd;

  const academicYearId =
    payload.academicYearId ?? existingSemester.academicYearId;

  // Check academic year
  const academicYear = await prisma.academicYear.findUnique({
    where: {
      id: academicYearId,
    },
  });

  if (!academicYear) {
    throw new AppError(httpStatus.NOT_FOUND, "Academic year not found");
  }

  // Semester date validation
  if (endDate <= startDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Semester end date must be after start date",
    );
  }

  // Registration date validation
  if (registrationEnd <= registrationStart) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Registration end date must be after registration start date",
    );
  }

  // Registration must finish before semester starts
  if (registrationEnd > startDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Registration must end before the semester starts",
    );
  }

  // Semester must be inside academic year
  if (startDate < academicYear.startDate || endDate > academicYear.endDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Semester dates must be within the academic year",
    );
  }

  // Check duplicate semester
  if (payload.name !== undefined || payload.academicYearId !== undefined) {
    const duplicateSemester = await prisma.semester.findFirst({
      where: {
        id: {
          not: id,
        },

        academicYearId,

        name: payload.name ?? existingSemester.name,
      },
    });

    if (duplicateSemester) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This semester already exists for the academic year",
      );
    }
  }

  const semester = await prisma.semester.update({
    where: {
      id,
    },

    data: {
      ...(payload.name !== undefined && {
        name: payload.name,
      }),

      ...(payload.startDate !== undefined && {
        startDate: payload.startDate,
      }),

      ...(payload.endDate !== undefined && {
        endDate: payload.endDate,
      }),

      ...(payload.registrationStart !== undefined && {
        registrationStart: payload.registrationStart,
      }),

      ...(payload.registrationEnd !== undefined && {
        registrationEnd: payload.registrationEnd,
      }),

      ...(payload.status !== undefined && {
        status: payload.status,
      }),

      ...(payload.academicYearId !== undefined && {
        academicYearId: payload.academicYearId,
      }),
    },

    include: {
      academicYear: true,
    },
  });

  return semester;
};

const deleteSemester = async (id: string) => {
  const semester = await prisma.semester.findUnique({
    where: {
      id,
    },

    include: {
      sections: true,
      registrations: true,
      academicRecords: true,
      feeStructures: true,
      studentScholarships: true,
    },
  });

  if (!semester) {
    throw new AppError(httpStatus.NOT_FOUND, "Semester not found");
  }

  if (semester.sections.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete semester because sections exist",
    );
  }

  if (semester.registrations.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete semester because registrations exist",
    );
  }

  if (semester.academicRecords.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete semester because academic records exist",
    );
  }

  if (semester.feeStructures.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete semester because fee structures exist",
    );
  }

  if (semester.studentScholarships.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete semester because student scholarships exist",
    );
  }

  await prisma.semester.delete({
    where: {
      id,
    },
  });

  return null;
};

export const SemesterService = {
  createSemester,
  getAllSemesters,
  getSemesterById,
  getSemestersByAcademicYear,
  updateSemester,
  deleteSemester,
};
