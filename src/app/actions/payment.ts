"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validation";

async function checkAuth(allowedRoles?: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function createPayment(data: any) {
  await checkAuth(["ADMIN", "ACCOUNTANT", "OPERATOR"]);

  const validated = paymentSchema.parse(data);

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });
    if (!customer) throw new Error("Customer not found");

    const payment = await prisma.payment.create({
      data: {
        customerId: validated.customerId,
        amount: validated.amount,
        method: validated.method,
        referenceId: validated.referenceId || null,
        notes: validated.notes || null,
        date: validated.date ? new Date(validated.date) : new Date(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    revalidatePath(`/dashboard/customers/${customer.id}`);
    
    return { success: true, payment };
  } catch (error: any) {
    console.error("Create payment error:", error);
    return { success: false, error: error.message || "Failed to record payment." };
  }
}

export async function deletePayment(id: string) {
  await checkAuth(["ADMIN"]);

  try {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new Error("Payment not found");

    await prisma.payment.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    revalidatePath(`/dashboard/customers/${payment.customerId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Delete payment error:", error);
    return { success: false, error: error.message || "Failed to delete payment record." };
  }
}
