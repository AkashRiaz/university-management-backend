import { DepartmentWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateDepartmentPayload,
  IUpdateDepartmentPayload,
} from "./department.interface";
import httpStatus from "http-status";

const createDepartment = async (payload: ICreateDepartmentPayload) => {
  console.log("Payload received in createDepartment:", payload);
  const faculty = await prisma.faculty.findUnique({
    where: {
      id: payload.facultyId,
    },
  });

  if (!faculty) {
    throw new AppError(httpStatus.NOT_FOUND, "Faculty not found");
  }

  const existingDepartment = await prisma.department.findUnique({
    where: {
      facultyId_code: {
        facultyId: payload.facultyId,
        code: payload.code,
      },
    },
  });

  if (existingDepartment) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Department code already exists in this faculty",
    );
  }

  const department = await prisma.department.create({
    data: {
      ...payload,
    },
    include: {
      faculty: true,
    },
  });
  return department;
};

const getAllDepartments = async (query: IQuery) => {
  const limit = query.limit ? parseInt(query.limit) : 10;

  const page = query.page ? parseInt(query.page) : 1;

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "name",
    "code",
    "building",
    "phone",
    "email",
    "createdAt",
    "updatedAt",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: DepartmentWhereInput[] = [];

  /*
   * Search
   */

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },

        {
          code: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },

        {
          description: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },

        {
          building: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },

        {
          phone: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },

        {
          email: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },

        {
          faculty: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },

        {
          faculty: {
            code: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (query.facultyId) {
    andConditions.push({
      facultyId: query.facultyId,
    });
  }

  const departments = await prisma.department.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      faculty: true,

      _count: {
        select: {
          programs: true,
          courses: true,
          students: true,
          instructors: true,
          sections: true,
        },
      },
    },
  });

  const total = await prisma.department.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: departments,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getDepartmentById = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: {
      id,
    },

    include: {
      faculty: true,
    },
  });

  if (!department) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  return department;
};

const updateDepartment = async (
  id: string,
  payload: IUpdateDepartmentPayload,
) => {
  const existingDepartment = await prisma.department.findUnique({
    where: {
      id,
    },
  });

  if (!existingDepartment) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  /*
   * If facultyId is being changed,
   * verify that the new faculty exists.
   */
  if (payload.facultyId) {
    const faculty = await prisma.faculty.findUnique({
      where: {
        id: payload.facultyId,
      },
    });

    if (!faculty) {
      throw new AppError(httpStatus.NOT_FOUND, "Faculty not found");
    }
  }

  /*
   * Check duplicate department code
   * within the faculty.
   */
  if (payload.code || payload.facultyId) {
    const facultyId = payload.facultyId ?? existingDepartment.facultyId;

    const code = payload.code ?? existingDepartment.code;

    const existingCode = await prisma.department.findUnique({
      where: {
        facultyId_code: {
          facultyId,
          code,
        },
      },
    });

    if (existingCode && existingCode.id !== id) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Department code already exists in this faculty",
      );
    }
  }

  const department = await prisma.department.update({
    where: {
      id,
    },
    data: payload,
    include: {
      faculty: true,
    },
  });

  return department;
};

const deleteDepartment = async (id: string) => {
  const existingDepartment = await prisma.department.findUnique({
    where: {
      id,
    },
  });

  if (!existingDepartment) {
    throw new AppError(httpStatus.NOT_FOUND, "Department not found");
  }

  /*
   * Don't delete a department if it
   * still contains programs.
   */
  const programCount = await prisma.program.count({
    where: {
      departmentId: id,
    },
  });

  if (programCount > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Cannot delete department because programs are associated with it",
    );
  }

  const instructorCount = await prisma.instructorProfile.count({
    where: {
      departmentId: id,
    },
  });

  if (instructorCount > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Cannot delete department because instructors are associated with it",
    );
  }

  const department = await prisma.department.delete({
    where: {
      id,
    },
  });

  return department;
};

export const DepartmentService = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
