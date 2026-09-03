import  bcrypt  from 'bcrypt';
import { Role, UserStatus } from "../../generated/prisma/enums";
import { config } from "../config";
import { prisma } from "../lib/prisma";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await prisma.user.findFirst({
      where: {
        role: Role.SUPER_ADMIN,
      },
    });

    if (isSuperAdminExist) {
      console.log("Super Admin Already Exists!");
      return;
    }

    const name = config.super_admin_name;
    const email = config.super_admin_email;
    const password = config.super_admin_password;

    if (!name || !email || !password) {
      throw new Error(
        "Super Admin Name, Email, Password Missing In Env File!!!",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const superAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log("Super Admin Created:", superAdmin.email);
  } catch (error) {
    console.log("Error Seeding Super Admin:", error);
  }
};

// ============================================
// Seed Tester Admin
// ============================================

export const seedTesterAdmin = async () => {
  try {
    const isTesterAdminExist = await prisma.user.findUnique({
      where: {
        email: config.tester_admin_email,
      },
    });

    if (isTesterAdminExist) {
      console.log("Tester Admin Already Exists!");
      return;
    }

    const name = config.tester_admin_name;
    const email = config.tester_admin_email;
    const password = config.tester_admin_password;

    if (!name || !email || !password) {
      throw new Error(
        "Tester Admin Name, Email, Password Missing In Env File!!!",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const testerAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log("Tester Admin Created:", testerAdmin.email);
  } catch (error) {
    console.log("Error Seeding Tester Admin:", error);
  }
};

// ============================================
// Seed Department Admin
// ============================================

export const seedDepartmentAdmin = async () => {
  try {
    const isExist = await prisma.user.findUnique({
      where: {
        email: config.tester_department_admin_email,
      },
    });

    if (isExist) {
      console.log("Tester Department Admin Already Exists!");
      return;
    }

    const name = config.tester_department_admin_name;
    const email = config.tester_department_admin_email;
    const password = config.tester_department_admin_password;

    if (!name || !email || !password) {
      throw new Error(
        "Department Admin Name, Email, Password Missing In Env File!!!",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const departmentAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.DEPARTMENT_ADMIN,
        status: UserStatus.ACTIVE,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log("Department Admin Created:", departmentAdmin.email);
  } catch (error) {
    console.log("Error Seeding Department Admin:", error);
  }
};

// ============================================
// Seed Registrar
// ============================================

export const seedRegistrar = async () => {
  try {
    const isExist = await prisma.user.findUnique({
      where: {
        email: config.tester_registrar_email,
      },
    });

    if (isExist) {
      console.log("Tester Registrar Already Exists!");
      return;
    }

    const name = config.tester_registrar_name;
    const email = config.tester_registrar_email;
    const password = config.tester_registrar_password;

    if (!name || !email || !password) {
      throw new Error("Registrar Name, Email, Password Missing In Env File!!!");
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const registrar = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.REGISTRAR,
        status: UserStatus.ACTIVE,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log("Tester Registrar Created:", registrar.email);
  } catch (error) {
    console.log("Error Seeding Registrar:", error);
  }
};

// ============================================
// Seed Finance Admin
// ============================================

export const seedFinanceAdmin = async () => {
  try {
    const isExist = await prisma.user.findUnique({
      where: {
        email: config.tester_finance_admin_email,
      },
    });

    if (isExist) {
      console.log("Tester Finance Admin Already Exists!");
      return;
    }

    const name = config.tester_finance_admin_name;
    const email = config.tester_finance_admin_email;
    const password = config.tester_finance_admin_password;

    if (!name || !email || !password) {
      throw new Error(
        "Finance Admin Name, Email, Password Missing In Env File!!!",
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const financeAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.FINANCE_ADMIN,
        status: UserStatus.ACTIVE,
        needPasswordChange: false,
        emailVerified: true,
      },
    });

    console.log("Tester Finance Admin Created:", financeAdmin.email);
  } catch (error) {
    console.log("Error Seeding Finance Admin:", error);
  }
};
