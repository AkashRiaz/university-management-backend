import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateSectionInstructorPayload,
  IUpdateSectionInstructorPayload,
} from "./sectionInstructor.interface";
import httpStatus from "http-status";

const createSectionInstructor = async (
  payload: ICreateSectionInstructorPayload,
) => {
  const { sectionId, instructorId, isPrimary = false } = payload;

  // Check section
  const section = await prisma.section.findUnique({
    where: {
      id: sectionId,
    },
  });

  if (!section) {
    throw new AppError(httpStatus.NOT_FOUND, "Section not found");
  }

  // Check instructor
  const instructor = await prisma.instructorProfile.findUnique({
    where: {
      id: instructorId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isDeleted: true,
        },
      },
    },
  });

  if (!instructor || instructor.user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Instructor not found");
  }

  // Check existing assignment
  const existingAssignment = await prisma.sectionInstructor.findUnique({
    where: {
      sectionId_instructorId: {
        sectionId,
        instructorId,
      },
    },
  });

  if (existingAssignment) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Instructor is already assigned to this section",
    );
  }

  /*
   * If this instructor should become primary,
   * remove primary status from other instructors
   * of this section.
   */
  const result = await prisma.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.sectionInstructor.updateMany({
        where: {
          sectionId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    return tx.sectionInstructor.create({
      data: {
        sectionId,
        instructorId,
        isPrimary,
      },

      include: {
        section: {
          include: {
            course: true,
            semester: true,
          },
        },

        instructor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },
            department: true,
          },
        },
      },
    });
  });

  return result;
};

const getAllSectionInstructors = async () => {
  const result = await prisma.sectionInstructor.findMany({
    include: {
      section: {
        include: {
          course: true,
          semester: true,
        },
      },

      instructor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },

          department: true,
        },
      },
    },

    orderBy: {
      id: "desc",
    },
  });

  return result;
};

const getSectionInstructorsBySection = async (sectionId: string) => {
  const section = await prisma.section.findUnique({
    where: {
      id: sectionId,
    },
  });

  if (!section) {
    throw new AppError(httpStatus.NOT_FOUND, "Section not found");
  }

  const result = await prisma.sectionInstructor.findMany({
    where: {
      sectionId,
    },

    include: {
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },

          department: true,
        },
      },
    },

    orderBy: [
      {
        isPrimary: "desc",
      },
      {
        id: "desc",
      },
    ],
  });

  return result;
};

const getInstructorSections = async (instructorId: string) => {
  const instructor = await prisma.instructorProfile.findUnique({
    where: {
      id: instructorId,
    },
  });

  if (!instructor) {
    throw new AppError(httpStatus.NOT_FOUND, "Instructor not found");
  }

  const result = await prisma.sectionInstructor.findMany({
    where: {
      instructorId,
    },

    include: {
      section: {
        include: {
          course: true,
          semester: true,
        },
      },
    },

    orderBy: {
      id: "desc",
    },
  });

  return result;
};

const getSectionInstructorById = async (id: string) => {
  const result = await prisma.sectionInstructor.findUnique({
    where: {
      id,
    },

    include: {
      section: {
        include: {
          course: true,
          semester: true,
        },
      },

      instructor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },

          department: true,
        },
      },
    },
  });

  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Section instructor assignment not found",
    );
  }

  return result;
};

const getMyInstructorSections = async (userId: string) => {
  /*
   * Find logged-in instructor profile
   */
  const instructor = await prisma.instructorProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!instructor) {
    throw new AppError(httpStatus.NOT_FOUND, "Instructor profile not found");
  }

  /*
   * Find sections assigned to this instructor
   */
  const result = await prisma.sectionInstructor.findMany({
    where: {
      instructorId: instructor.id,
    },

    include: {
      section: {
        include: {
          course: true,
          semester: true,
        },
      },

      instructor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },

          department: true,
        },
      },
    },

    orderBy: {
      id: "desc",
    },
  });

  return result;
};

const updateSectionInstructor = async (
  id: string,
  payload: IUpdateSectionInstructorPayload,
) => {
  const existingAssignment = await prisma.sectionInstructor.findUnique({
    where: {
      id,
    },
  });

  if (!existingAssignment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Section instructor assignment not found",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    /*
     * Only one instructor should be primary
     * for a section.
     */
    if (payload.isPrimary === true) {
      await tx.sectionInstructor.updateMany({
        where: {
          sectionId: existingAssignment.sectionId,

          isPrimary: true,

          NOT: {
            id,
          },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    return tx.sectionInstructor.update({
      where: {
        id,
      },

      data: payload,

      include: {
        section: {
          include: {
            course: true,
            semester: true,
          },
        },

        instructor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },

            department: true,
          },
        },
      },
    });
  });

  return result;
};

const deleteSectionInstructor = async (id: string) => {
  const existingAssignment = await prisma.sectionInstructor.findUnique({
    where: {
      id,
    },
  });

  if (!existingAssignment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Section instructor assignment not found",
    );
  }

  const result = await prisma.sectionInstructor.delete({
    where: {
      id,
    },
  });

  return result;
};

export const SectionInstructorService = {
  createSectionInstructor,
  getAllSectionInstructors,
  getSectionInstructorsBySection,
  getInstructorSections,
  getSectionInstructorById,
  getMyInstructorSections,
  updateSectionInstructor,
  deleteSectionInstructor,
};
