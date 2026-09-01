import express, { Application } from "express";
import cors from "cors";
import { config } from "./app/config";
import cookieParser from "cookie-parser";
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

export default app;
