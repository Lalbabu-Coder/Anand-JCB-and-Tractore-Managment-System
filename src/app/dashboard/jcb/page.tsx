import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JCBClient } from "./jcb-client";

export default async function JCBPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  // 1. Fetch data for selectors
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, village: true },
    orderBy: { name: "asc" },
  });

  const machines = await prisma.machine.findMany({
    where: { type: "JCB", status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 2. Fetch default settings
  const rateSetting = await prisma.setting.findUnique({
    where: { key: "DEFAULT_JCB_RATE" },
  });
  const defaultRate = Number(rateSetting?.value) || 1400;

  // 3. Fetch recent work logs
  const recentLogs = await prisma.jCBWork.findMany({
    include: {
      customer: { select: { name: true, village: true } },
      machine: { select: { name: true } },
    },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <JCBClient
      customers={customers}
      machines={machines}
      recentLogs={recentLogs.map((log) => ({
        id: log.id,
        date: log.date.toISOString(),
        totalHours: log.totalHours,
        ratePerHour: log.ratePerHour,
        totalAmount: log.totalAmount,
        advancePaid: log.advancePaid,
        remainingBalance: log.remainingBalance,
        operatorName: log.operatorName,
        customer: log.customer,
        machine: log.machine,
        pdfUrl: log.pdfUrl,
      }))}
      defaultRate={defaultRate}
      currentUserName={session?.user?.name || ""}
      isAdmin={isAdmin}
    />
  );
}
