"use server";

import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "OPERATOR", "ACCOUNTANT"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerUser(data: any) {
  try {
    const validated = registerSchema.parse(data);

    // Check if email already registered
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return { success: false, error: "This email address is already registered." };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Save user
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        role: validated.role,
        passwordHash,
      },
    });

    return { success: true, user: { id: user.id, email: user.email } };
  } catch (error: any) {
    console.error("Signup error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation failed" };
    }
    return { success: false, error: error.message || "Failed to create account." };
  }
}
