import { prisma } from "../src/lib/prisma";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // 1. Create Default Users
  const roles = [
    { email: "admin@anandjcb.com", name: "Lalbabu Admin", role: "ADMIN", pass: "admin123" },
    { email: "operator@anandjcb.com", name: "Operator Suresh", role: "OPERATOR", pass: "operator123" },
    { email: "accountant@anandjcb.com", name: "Accountant Ramesh", role: "ACCOUNTANT", pass: "accountant123" },
  ] as const;

  for (const user of roles) {
    const passwordHash = await bcrypt.hash(user.pass, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
      },
    });
  }
  console.log("Users seeded.");

  // 2. Create Default Machines
  const machines = [
    { name: "JCB Pro 3DX", type: "JCB", status: "ACTIVE" },
    { name: "John Deere 5050D", type: "TRACTOR", status: "ACTIVE" },
    { name: "Mahindra Arjun 555", type: "TRACTOR", status: "ACTIVE" },
  ] as const;

  for (const m of machines) {
    const existing = await prisma.machine.findFirst({
      where: { name: m.name },
    });
    if (!existing) {
      await prisma.machine.create({
        data: {
          name: m.name,
          type: m.type as any,
          status: m.status,
        },
      });
    }
  }
  console.log("Machines seeded.");

  // 3. Create Default Settings
  const settings = [
    { key: "SMS_TEMPLATE_JCB", value: "Namaste {customerName},\nYour JCB work has been completed.\nHours: {hours}\nRate: ₹{rate}/hour\nTotal: ₹{total}\nAdvance: ₹{advance}\nRemaining: ₹{remaining}\nThank you - Anand JCB & Tractor.", description: "SMS Template for JCB work completion" },
    { key: "SMS_TEMPLATE_TRACTOR", value: "Namaste {customerName},\nYour Tractor work ({workType}) has been completed.\nArea: {area} Bigha\nRate: ₹{rate}/Bigha\nTotal: ₹{total}\nAdvance: ₹{advance}\nRemaining: ₹{remaining}\nThank you - Anand JCB & Tractor.", description: "SMS Template for Tractor work completion" },
    { key: "SMS_TEMPLATE_REMINDER", value: "Dear {customerName},\nYour pending balance is ₹{remaining}.\nPlease pay at your earliest convenience.\nThank you - Anand JCB & Tractor.", description: "SMS Template for pending payment reminder" },
    { key: "UPI_ID", value: "lalbabu@upi", description: "UPI ID for QR Code payment receipt" },
    { key: "UPI_MERCHANT_NAME", value: "Anand JCB & Tractor", description: "Merchant Name for UPI" },
    { key: "DEFAULT_JCB_RATE", value: "1400", description: "Default rate per hour for JCB" },
    { key: "DEFAULT_TRACTOR_RATE_PLOUGHING", value: "800", description: "Default rate per bigha for ploughing" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("Settings seeded.");

  // 4. Create a Default Customer for testing
  const customer = await prisma.customer.upsert({
    where: { mobile: "9876543210" },
    update: {},
    create: {
      name: "Ramesh Patel",
      mobile: "9876543210",
      village: "Rampur",
      address: "Near Temple, Rampur, UP",
      notes: "Regular client",
    },
  });
  console.log("Default Customer seeded.");

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
