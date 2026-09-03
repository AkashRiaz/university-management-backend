import app from "./app";
import { config } from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { seedDepartmentAdmin, seedFinanceAdmin, seedRegistrar, seedSuperAdmin, seedTesterAdmin } from "./app/utils/seed";

const PORT = config.port;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");

    await redisClient.connect();
    console.log("Connected to Redis successfully.");

    await transporter.verify();
    console.log("SMTP transporter is ready to send emails.");

    // seeding

    await seedSuperAdmin();
    console.log("Super Admin seeding completed successfully.");
    await seedTesterAdmin();
    console.log("Tester Admin seeding completed successfully.");
    await seedDepartmentAdmin();
    console.log("Department Admin seeding completed successfully.");
    await seedRegistrar();
    console.log("Registrar seeding completed successfully.");
    await seedFinanceAdmin();
    console.log("Finance Admin seeding completed successfully.");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
};

main();
