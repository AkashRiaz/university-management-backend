import express, { Application } from "express";
import cors from "cors";
import { config } from "./app/config";
import cookieParser from "cookie-parser";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { DepartmentRoutes } from "./app/module/department/department.route";
import { FacultyRoutes } from "./app/module/faculty/faculty.route";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
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

app.use(notFound);
app.use(globalErrorHandler);

export default app;
