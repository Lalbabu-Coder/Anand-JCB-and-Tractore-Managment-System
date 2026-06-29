import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentsClient } from "./payments-client";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  // 1. Fetch customers with work & payment relations to calculate dues
  const customersData = await prisma.customer.findMany({
    include: {
      jcbWorks: { select: { totalAmount: true, advancePaid: true } },
      tractorWorks: { select: { totalAmount: true, advancePaid: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { name: "asc" },
  });

  const customerList = customersData.map((c) => {
    const totalJcb = c.jcbWorks.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalTractor = c.tractorWorks.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalWork = totalJcb + totalTractor;

    const jcbAdvances = c.jcbWorks.reduce((acc, curr) => acc + curr.advancePaid, 0);
    const tractorAdvances = c.tractorWorks.reduce((acc, curr) => acc + curr.advancePaid, 0);
    const paymentsSum = c.payments.reduce((acc, curr) => acc + curr.amount, 0);
    
    const totalPaid = jcbAdvances + tractorAdvances + paymentsSum;
    const remaining = Math.max(0, totalWork - totalPaid);

    return {
      id: c.id,
      name: c.name,
      village: c.village,
      remaining,
    };
  });

  // 2. Fetch recent payments history
  const recentPayments = await prisma.payment.findMany({
    include: {
      customer: { select: { name: true, village: true } },
    },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <PaymentsClient
      customers={customerList}
      recentPayments={recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        referenceId: p.referenceId,
        notes: p.notes,
        date: p.date.toISOString(),
        customer: p.customer,
      }))}
      isAdmin={isAdmin}
    />
  );
}
