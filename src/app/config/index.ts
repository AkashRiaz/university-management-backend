import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const config = {
  frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
  port: process.env.PORT!,
  node_env: process.env.NODE_ENV,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,
  redis_host: process.env.REDIS_HOST!,
  redis_port: process.env.REDIS_PORT!,
  redis_password: process.env.REDIS_PASSWORD!,
  redis_user: process.env.REDIS_USER!,
  smtp_user: process.env.SMTP_USER!,
  smtp_password: process.env.SMTP_PASSWORD!,
  smtp_host: process.env.SMTP_HOST!,
  smtp_port: process.env.SMTP_PORT!,
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY!,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET!,
  google_client_id: process.env.GOOGLE_CLIENT_ID,

  bkash_base_url: process.env.BKASH_BASE_URL!,
  bkash_app_key: process.env.BKASH_APP_KEY!,
  bkash_app_secret: process.env.BKASH_APP_SECRET!,
  bkash_username: process.env.BKASH_USERNAME!,
  bkash_password: process.env.BKASH_PASSWORD!,
  bkash_callback_url: process.env.BKASH_CALLBACK_URL!,
  bkash_refund_url: process.env.BKASH_REFUND_URL!,

  super_admin_name: process.env.SUPER_ADMIN_NAME,
  super_admin_email: process.env.SUPER_ADMIN_EMAIL,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD,

  // ============================================
  // Tester Admin
  // ============================================

  tester_admin_name: process.env.TESTER_ADMIN_NAME,
  tester_admin_email: process.env.TESTER_ADMIN_EMAIL,
  tester_admin_password: process.env.TESTER_ADMIN_PASSWORD,

  // ============================================
  // Tester Department Admin
  // ============================================

  tester_department_admin_name: process.env.TESTER_DEPARTMENT_ADMIN_NAME,
  tester_department_admin_email: process.env.TESTER_DEPARTMENT_ADMIN_EMAIL,
  tester_department_admin_password:process.env.TESTER_DEPARTMENT_ADMIN_PASSWORD,

  // ============================================
  // Tester Registrar
  // ============================================

  tester_registrar_name: process.env.TESTER_REGISTRAR_NAME,
  tester_registrar_email: process.env.TESTER_REGISTRAR_EMAIL,
  tester_registrar_password: process.env.TESTER_REGISTRAR_PASSWORD,

  // ============================================
  // Tester Finance Admin
  // ============================================

  tester_finance_admin_name: process.env.TESTER_FINANCE_ADMIN_NAME,
  tester_finance_admin_email: process.env.TESTER_FINANCE_ADMIN_EMAIL,
  tester_finance_admin_password: process.env.TESTER_FINANCE_ADMIN_PASSWORD,
};
