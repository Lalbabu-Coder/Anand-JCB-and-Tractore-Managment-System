import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CustomerDetailsClient } from "./customer-details-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // 1. Fetch customer records from DB
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      jcbWorks: {
        include: { machine: true },
        orderBy: { date: "desc" },
      },
      tractorWorks: {
        include: { machine: true, operations: true },
        orderBy: { date: "desc" },
      },
      payments: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  // 2. Perform dynamic financial aggregations
  const totalJcb = customer.jcbWorks.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalTractor = customer.tractorWorks.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalWork = totalJcb + totalTractor;

  const jcbAdvances = customer.jcbWorks.reduce((acc, curr) => acc + curr.advancePaid, 0);
  const tractorAdvances = customer.tractorWorks.reduce((acc, curr) => acc + curr.advancePaid, 0);
  const paymentsSum = customer.payments.reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalPaid = jcbAdvances + tractorAdvances + paymentsSum;
  const remaining = Math.max(0, totalWork - totalPaid);

  // 3. Retrieve settings for UPI Payment QR
  const upiIdSetting = await prisma.setting.findUnique({ where: { key: "UPI_ID" } });
  const merchantSetting = await prisma.setting.findUnique({ where: { key: "UPI_MERCHANT_NAME" } });

  let upiString = "";
  if (upiIdSetting?.value && remaining > 0) {
    const name = merchantSetting?.value || "Anand JCB & Tractor";
    upiString = `upi://pay?pa=${upiIdSetting.value}&pn=${encodeURIComponent(name)}&am=${remaining}&cu=INR`;
  }

  return (
    <CustomerDetailsClient
      customer={{
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        village: customer.village,
        image: customer.image,
        address: customer.address,
        notes: customer.notes,
      }}
      metrics={{
        totalWork,
        totalPaid,
        remaining,
      }}
      jcbHistory={customer.jcbWorks}
      tractorHistory={customer.tractorWorks}
      paymentHistory={customer.payments}
      upiString={upiString || undefined}
    />
  );
}
