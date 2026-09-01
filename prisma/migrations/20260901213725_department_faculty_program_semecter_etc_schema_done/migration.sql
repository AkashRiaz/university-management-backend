-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "building" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "facultyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "durationYears" INTEGER NOT NULL,
    "totalCredits" DECIMAL(6,2) NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "name" "SemesterType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "registrationStart" TIMESTAMP(3) NOT NULL,
    "registrationEnd" TIMESTAMP(3) NOT NULL,
    "status" "SemesterStatus" NOT NULL DEFAULT 'UPCOMING',
    "academicYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "phone" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "admissionYear" INTEGER NOT NULL,
    "currentSemesterNumber" INTEGER,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "academicStatus" "AcademicStatus" NOT NULL DEFAULT 'GOOD_STANDING',
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_id_sequences" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_id_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE INDEX "departments_facultyId_idx" ON "departments"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_facultyId_code_key" ON "departments"("facultyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_code_key" ON "faculties"("code");

-- CreateIndex
CREATE INDEX "faculties_name_idx" ON "faculties"("name");

-- CreateIndex
CREATE INDEX "programs_departmentId_idx" ON "programs"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "programs_departmentId_code_key" ON "programs"("departmentId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "semesters_academicYearId_idx" ON "semesters"("academicYearId");

-- CreateIndex
CREATE INDEX "semesters_status_idx" ON "semesters"("status");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_academicYearId_name_key" ON "semesters"("academicYearId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_studentId_key" ON "student_profiles"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_departmentId_idx" ON "student_profiles"("departmentId");

-- CreateIndex
CREATE INDEX "student_profiles_programId_idx" ON "student_profiles"("programId");

-- CreateIndex
CREATE INDEX "student_profiles_status_idx" ON "student_profiles"("status");

-- CreateIndex
CREATE INDEX "student_profiles_admissionYear_idx" ON "student_profiles"("admissionYear");

-- CreateIndex
CREATE UNIQUE INDEX "student_id_sequences_departmentId_year_key" ON "student_id_sequences"("departmentId", "year");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_id_sequences" ADD CONSTRAINT "student_id_sequences_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
