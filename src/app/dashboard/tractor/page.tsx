import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TractorClient } from "./tractor-client";

export default async function TractorPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  // 1. Fetch selector parameters
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, village: true },
    orderBy: { name: "asc" },
  });

  const machines = await prisma.machine.findMany({
    where: { type: "TRACTOR", status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 2. Fetch default settings
  const rateSetting = await prisma.setting.findUnique({
    where: { key: "DEFAULT_TRACTOR_RATE_PLOUGHING" },
  });
  const defaultRate = Number(rateSetting?.value) || 800;

  // 3. Fetch recent work logs
  const recentLogs = await prisma.tractorWork.findMany({
    include: {
      customer: { select: { name: true, village: true } },
      machine: { select: { name: true } },
      operations: true,
    },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <TractorClient
      customers={customers}
      machines={machines}
      recentLogs={recentLogs.map((log) => ({
        id: log.id,
        date: log.date.toISOString(),
        totalAmount: log.totalAmount,
        advancePaid: log.advancePaid,
        remainingBalance: log.remainingBalance,
        operatorName: log.operatorName,
        customer: log.customer,
        machine: log.machine,
        pdfUrl: log.pdfUrl,
        operations: log.operations.map((op) => ({
          workType: op.workType,
          area: op.area,
          ratePerArea: op.ratePerArea,
          tripCount: op.tripCount,
          ratePerTrip: op.ratePerTrip,
          landUnit: op.landUnit,
          numberOfPasses: op.numberOfPasses,
        })),
      }))}
      defaultRatePloughing={defaultRate}
      currentUserName={session?.user?.name || ""}
      isAdmin={isAdmin}
    />
  );
}
