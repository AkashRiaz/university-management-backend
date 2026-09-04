import express, { Application } from "express";
import cors from "cors";
import { config } from "./app/config";
import cookieParser from "cookie-parser";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { DepartmentRoutes } from "./app/module/department/department.route";
import { FacultyRoutes } from "./app/module/faculty/faculty.route";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { StudentRoutes } from "./app/module/student/student.route";
import { ProgramRoutes } from "./app/module/program/program.route";
import { InstructorRoutes } from "./app/module/instructor/instructor.route";
import { AcademicYearRoutes } from "./app/module/academicYear/academicYear.route";
import { SemesterRoutes } from "./app/module/semester/semester.route";
import { CourseRoutes } from "./app/module/course/course.route";
import { ProgramCourseRoutes } from "./app/module/programCourse/programCourse.route";
import { CoursePrerequisiteRoutes } from "./app/module/coursePrerequisite/coursePrerequisite.route";
import { RoomRoutes } from "./app/module/room/room.route";
import { SectionRoutes } from "./app/module/section/section.route";
import { ClassScheduleRoutes } from "./app/module/classSchedule/classSchedule.route";
import { AnnouncementRoutes } from "./app/module/announcement/announcement.route";
import { FeeStructureRoutes } from "./app/module/feeStructure/feeStructure.route";
import { FeeStructureItemRoutes } from "./app/module/feeStructureItem/feeStructureItem.route";
import { ScholarshipRoutes } from "./app/module/scholarship/scholarship.route";
import { StudentScholarshipRoutes } from "./app/module/studentScholarship/studentScholarship.route";
const app: Application = express();

app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Health check successful",
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the University Management System",
  });
});

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/departments", DepartmentRoutes);
app.use("/api/v1/faculties", FacultyRoutes);
app.use("/api/v1/students", StudentRoutes);
app.use("/api/v1/instructors", InstructorRoutes);
app.use("/api/v1/programs", ProgramRoutes);
app.use("/api/v1/academic-years", AcademicYearRoutes);
app.use("/api/v1/semesters", SemesterRoutes);
app.use("/api/v1/courses", CourseRoutes);
app.use("/api/v1/program-courses", ProgramCourseRoutes);
app.use("/api/v1/course-prerequisites", CoursePrerequisiteRoutes);
app.use("/api/v1/rooms", RoomRoutes);
app.use("/api/v1/sections", SectionRoutes);
app.use("/api/v1/class-schedules", ClassScheduleRoutes);
app.use("/api/v1/announcements", AnnouncementRoutes);
app.use("/api/v1/fee-structures", FeeStructureRoutes);
app.use("/api/v1/fee-structure-items", FeeStructureItemRoutes);
app.use("/api/v1/scholarships", ScholarshipRoutes);
app.use("/api/v1/student-scholarships", StudentScholarshipRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
