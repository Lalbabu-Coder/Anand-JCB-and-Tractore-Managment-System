import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomersClient } from "./customers-client";

interface SearchParams {
  q?: string;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const resolvedParams = await searchParams;
  const q = resolvedParams?.q || "";

  // 1. Fetch filtered customers
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { mobile: { contains: q } },
            { village: { contains: q } },
          ],
        }
      : {},
    include: {
      jcbWorks: { select: { totalAmount: true, advancePaid: true } },
      tractorWorks: { select: { totalAmount: true, advancePaid: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { name: "asc" },
  });

  // 2. Map and aggregate balances dynamically
  const customerList = customers.map((c) => {
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
      mobile: c.mobile,
      village: c.village,
      image: c.image,
      address: c.address,
      notes: c.notes,
      totalWork,
      totalPaid,
      remaining,
    };
  });

  return <CustomersClient initialCustomers={customerList} isAdmin={isAdmin} />;
}
