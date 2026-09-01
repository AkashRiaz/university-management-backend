import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const config = {
  frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
  port: process.env.PORT!,
};
