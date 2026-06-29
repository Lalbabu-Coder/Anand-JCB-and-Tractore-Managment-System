"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin privilege required.");
  }
  return session;
}

// ------------------ SETTINGS ------------------
export async function updateSetting(key: string, value: string, description?: string) {
  await checkAdmin();

  try {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
    revalidatePath("/dashboard/admin");
    return { success: true, setting };
  } catch (error: any) {
    console.error("Update setting error:", error);
    return { success: false, error: error.message || "Failed to update setting." };
  }
}

// ------------------ USERS ------------------
export async function createUser(data: { name: string; email: string; role: "ADMIN" | "OPERATOR" | "ACCOUNTANT"; pass: string }) {
  await checkAdmin();

  if (!data.name || !data.email || !data.pass) {
    return { success: false, error: "Missing required user fields." };
  }

  try {
    const passwordHash = await bcrypt.hash(data.pass, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash,
      },
    });
    revalidatePath("/dashboard/admin");
    return { success: true, user };
  } catch (error: any) {
    console.error("Create user error:", error);
    if (error.code === "P2002") {
      return { success: false, error: "A user with this email already exists." };
    }
    return { success: false, error: error.message || "Failed to create user." };
  }
}

export async function deleteUser(id: string) {
  await checkAdmin();

  try {
    // Prevent admin from deleting themselves
    const session = await getServerSession(authOptions);
    if (session?.user?.id === id) {
      return { success: false, error: "You cannot delete your own admin account." };
    }

    await prisma.user.delete({
      where: { id },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Delete user error:", error);
    return { success: false, error: error.message || "Failed to delete user." };
  }
}

// ------------------ MACHINES ------------------
export async function createMachine(data: { name: string; type: "JCB" | "TRACTOR"; status: string }) {
  await checkAdmin();

  try {
    const machine = await prisma.machine.create({
      data: {
        name: data.name,
        type: data.type,
        status: data.status,
      },
    });
    revalidatePath("/dashboard/admin");
    return { success: true, machine };
  } catch (error: any) {
    console.error("Create machine error:", error);
    return { success: false, error: error.message || "Failed to create machine." };
  }
}

export async function updateMachine(id: string, data: { name: string; type: "JCB" | "TRACTOR"; status: string }) {
  await checkAdmin();

  try {
    const machine = await prisma.machine.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        status: data.status,
      },
    });
    revalidatePath("/dashboard/admin");
    return { success: true, machine };
  } catch (error: any) {
    console.error("Update machine error:", error);
    return { success: false, error: error.message || "Failed to update machine." };
  }
}

export async function deleteMachine(id: string) {
  await checkAdmin();

  try {
    await prisma.machine.delete({
      where: { id },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Delete machine error:", error);
    return { success: false, error: error.message || "Failed to delete machine." };
  }
}
