import { prisma } from "../../lib/prisma";

const getAdminOverview = async () => {
  /**
   * These queries are independent.
   *
   * $transaction([...]) gives us one consistent dashboard snapshot
   * instead of counts potentially changing between queries.
   */
  const [
    totalStudents,
    totalInstructors,
    totalDepartments,
    totalPrograms,
    totalCourses,
    totalSemesters,
    totalRegistrations,
    totalInvoices,
    registrationStatusGroups,
    currentSemester,
    recentRegistrations,
    invoiceSummary,
  ] = await prisma.$transaction([
    prisma.studentProfile.count(),

    prisma.instructorProfile.count(),

    prisma.department.count(),

    prisma.program.count(),

    prisma.course.count(),

    prisma.semester.count(),

    prisma.registration.count(),

    prisma.invoice.count(),

    prisma.registration.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    prisma.semester.findFirst({
      where: {
        status: "ACTIVE",
      },
      include: {
        academicYear: true,
      },
      orderBy: {
        startDate: "desc",
      },
    }),

    prisma.registration.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    }),

    prisma.invoice.aggregate({
      _sum: {
        dueAmount: true,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  /**
   * Convert groupBy result:
   *
   * [
   *   { status: "DRAFT", _count: { _all: 10 } }
   * ]
   *
   * into:
   *
   * {
   *   DRAFT: 10
   * }
   */

  const registrationStatus = registrationStatusGroups.reduce<
    Record<string, number>
  >((acc, item) => {
    acc[item.status] = item._count._all;

    return acc;
  }, {});

  return {
    counts: {
      students: totalStudents,
      instructors: totalInstructors,
      departments: totalDepartments,
      programs: totalPrograms,
      courses: totalCourses,
      semesters: totalSemesters,
      registrations: totalRegistrations,
      invoices: totalInvoices,
    },

    registrationStatus: {
      draft: registrationStatus.DRAFT || 0,
      pending: registrationStatus.PENDING || 0,
      approved: registrationStatus.APPROVED || 0,
      rejected: registrationStatus.REJECTED || 0,
    },

    finance: {
      totalInvoices: invoiceSummary._count._all,
      totalOutstandingAmount: Number(invoiceSummary._sum.dueAmount) || 0,
    },

    currentSemester,

    recentRegistrations,
  };
};

const getStudentOverview = async (userId: string) => {
  return prisma.$transaction(async (tx) => {
    /**
     * 1. Find student's academic profile
     */

    const student = await tx.studentProfile.findUnique({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },

        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },

        program: {
          select: {
            id: true,
            name: true,
            code: true,
            durationYears: true,
            totalCredits: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error("Student profile not found");
    }

    /**
     * 2. Find active semester
     */

    const currentSemester = await tx.semester.findFirst({
      where: {
        status: "ACTIVE",
      },

      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        startDate: "desc",
      },
    });

    /**
     * If no active semester, return basic dashboard.
     */

    if (!currentSemester) {
      return {
        student,

        currentSemester: null,

        registration: null,

        courses: {
          count: 0,
          totalCredits: 0,
          items: [],
        },

        invoice: null,
      };
    }

    /**
     * 3. Find student's registration for current semester
     */

    const registration = await tx.registration.findFirst({
      where: {
        studentId: student.id,
        semesterId: currentSemester.id,
      },
    });

    /**
     * No registration created yet.
     */

    if (!registration) {
      const invoice = await tx.invoice.findFirst({
        where: {
          studentId: student.id,
          semesterId: currentSemester.id,
        },
      });

      return {
        student,

        currentSemester,

        registration: null,

        courses: {
          count: 0,
          totalCredits: 0,
          items: [],
        },

        invoice,
      };
    }

    /**
     * 4. Fetch selected course registrations + invoice
     *
     * These are independent after registration is known,
     * so Promise.all is appropriate here.
     */

    const [courseRegistrations, invoice] = await Promise.all([
      tx.courseRegistration.findMany({
        where: {
          registrationId: registration.id,
          status: "REGISTERED",
        },

        include: {
          section: {
            include: {
              course: {
                select: {
                  id: true,
                  code: true,
                  title: true,
                  credit: true,
                  courseType: true,
                  courseLevel: true,
                },
              },
            },
          },
        },
      }),

      tx.invoice.findFirst({
        where: {
          studentId: student.id,
          semesterId: currentSemester.id,
        },
      }),
    ]);

    /**
     * 5. Calculate registered credits
     */

    const totalCredits = courseRegistrations.reduce((total, item) => {
      return total + Number(item.section.course.credit || 0);
    }, 0);

    return {
      student,

      currentSemester,

      registration: {
        id: registration.id,
        registrationNumber: registration.registrationNumber,

        status: registration.status,

        programSemesterNumber: registration.programSemesterNumber,

        createdAt: registration.createdAt,
        updatedAt: registration.updatedAt,
      },

      courses: {
        count: courseRegistrations.length,
        totalCredits,
        items: courseRegistrations,
      },

      invoice,
    };
  });
};

export const DashboardService = {
  getAdminOverview,
  getStudentOverview,
};
