import cron from "node-cron";
import { prisma } from "./prisma";

export const deleteUnverifiedUsers = async () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          emailVerified: false,
          createdAt: {
            lt: oneHourAgo,
          },
        },
      });

      if (deletedUsers.count > 0) {
        console.log(`Deleted ${deletedUsers.count} unverified users.`);
      }
    } catch (error) {
      throw new Error(`Error deleting unverified users: ${error}`);
    }

    console.log("Cron job for deleting unverified users executed.");
  });
};
