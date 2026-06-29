import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // 1. Enforce Admin restriction at the server page level
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 2. Fetch admin dashboard data
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, profilePic: true },
    orderBy: { name: "asc" },
  });

  const machines = await prisma.machine.findMany({
    orderBy: { name: "asc" },
  });

  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <AdminClient
      users={users}
      machines={machines}
      settings={settings.map((s) => ({
        key: s.key,
        value: s.value,
        description: s.description,
      }))}
    />
  );
}
