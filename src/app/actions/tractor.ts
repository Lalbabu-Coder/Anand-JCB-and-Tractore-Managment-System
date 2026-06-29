"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tractorWorkSchema } from "@/lib/validation";

import { sendSMS, sendWhatsApp, parseTemplate } from "@/lib/twilio";

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

export async function createTractorWork(data: any) {
  await checkAuth(["ADMIN", "OPERATOR"]);

  const validated = tractorWorkSchema.parse(data);

  // 1. Calculate base amounts for each operation
  let totalBaseAmount = 0;
  
  const operationsToCreate = validated.operations.map(op => {
    let opAmount = 0;
    if (op.pricingMethod === "FIXED_TOTAL") {
      opAmount = op.fixedTotalAmount || 0;
    } else {
      const isTransport = ["SOIL_FILLING", "SAND_TRANSPORT", "BRICK_TRANSPORT", "WATER_TANK_SUPPLY", "TROLLEY_TRANSPORT", "TROLLEY"].includes(op.workType);
      if (isTransport) {
        opAmount = (op.tripCount || 0) * (op.ratePerTrip || 0);
      } else {
        opAmount = (op.area || 0) * (op.ratePerArea || 0);
      }
    }
    totalBaseAmount += opAmount;
    
    return {
      workType: op.workType,
      area: op.area || null,
      ratePerArea: op.ratePerArea || null,
      landUnit: op.landUnit || "Bigha",
      numberOfPasses: op.numberOfPasses || null,
      pricingMethod: op.pricingMethod || "RATE_PER_UNIT",
      tripCount: op.tripCount || null,
      ratePerTrip: op.ratePerTrip || null,
      amount: opAmount
    };
  });
  
  // Add extra charges
  const extraCharges = (validated.driverCharge || 0) + (validated.helperCharge || 0) + (validated.foodExpense || 0) + (validated.otherExpense || 0);
  
  const totalAmount = Math.round(totalBaseAmount + extraCharges);
  const remainingBalance = Math.max(0, totalAmount - validated.advancePaid);

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });
    if (!customer) throw new Error("Customer not found");

    // 2. Save work log and operations
    const work = await prisma.tractorWork.create({
      data: {
        customerId: validated.customerId,
        machineId: validated.machineId,
        date: new Date(validated.date),
        driverCharge: validated.driverCharge || null,
        helperCharge: validated.helperCharge || null,
        foodExpense: validated.foodExpense || null,
        otherExpense: validated.otherExpense || null,
        dieselCost: validated.dieselCost || 0,
        totalAmount,
        advancePaid: validated.advancePaid,
        remainingBalance,
        operatorName: validated.operatorName,
        notes: validated.notes || null,
        operations: {
          create: operationsToCreate
        }
      },
      include: {
        operations: true
      }
    });

    // 3. Get settings for PDF / SMS
    const upiIdSetting = await prisma.setting.findUnique({ where: { key: "UPI_ID" } });
    const merchantSetting = await prisma.setting.findUnique({ where: { key: "UPI_MERCHANT_NAME" } });
    const smsTemplateSetting = await prisma.setting.findUnique({ where: { key: "SMS_TEMPLATE_TRACTOR" } });

    // 4. Set relative API route URL for PDF receipt
    const pdfUrl = `/api/receipts?id=${work.id}&type=TRACTOR`;
    try {
      // Update TractorWork with pdfUrl
      await prisma.tractorWork.update({
        where: { id: work.id },
        data: { pdfUrl }
      });
    } catch (pdfErr) {
      console.error("Failed to update pdfUrl for work:", pdfErr);
    }

    // 5. Send notifications (SMS & WhatsApp)
    let smsSent = false;
    let waSent = false;
    let smsError = "";

    const rawTemplate = smsTemplateSetting?.value || 
      "Namaste {customerName},\nYour Tractor work has been completed.\nTotal: ₹{total}\nAdvance: ₹{advance}\nRemaining: ₹{remaining}\nThank you.";

    const smsBody = parseTemplate(rawTemplate, {
      customerName: customer.name,
      total: totalAmount,
      advance: validated.advancePaid,
      remaining: remainingBalance,
    });

    // Save outbound SMS notification record
    const smsNotify = await prisma.notification.create({
      data: {
        customerId: customer.id,
        type: "SMS",
        content: smsBody,
      },
    });

    const smsRes = await sendSMS(customer.mobile, smsBody);
    if (smsRes.success) {
      smsSent = true;
      await prisma.notification.update({
        where: { id: smsNotify.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    } else {
      smsError = smsRes.error || "Unknown Twilio SMS error";
      await prisma.notification.update({
        where: { id: smsNotify.id },
        data: { status: "FAILED" },
      });
    }

    // Send WhatsApp (mock or live)
    const waNotify = await prisma.notification.create({
      data: {
        customerId: customer.id,
        type: "WHATSAPP",
        content: smsBody,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const absolutePdfUrl = pdfUrl ? `${baseUrl}${pdfUrl}` : undefined;
    const waRes = await sendWhatsApp(customer.mobile, smsBody, absolutePdfUrl);
    if (waRes.success) {
      waSent = true;
      await prisma.notification.update({
        where: { id: waNotify.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    } else {
      await prisma.notification.update({
        where: { id: waNotify.id },
        data: { status: "FAILED" },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tractor");
    revalidatePath(`/dashboard/customers/${customer.id}`);
    
    return { 
      success: true, 
      work, 
      pdfUrl, 
      notifications: { smsSent, waSent, smsError } 
    };
  } catch (error: any) {
    console.error("Create tractor work error:", error);
    return { success: false, error: error.message || "Failed to log tractor work." };
  }
}

export async function deleteTractorWork(id: string) {
  await checkAuth(["ADMIN"]);

  try {
    await prisma.tractorWork.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tractor");
    return { success: true };
  } catch (error: any) {
    console.error("Delete tractor work error:", error);
    return { success: false, error: error.message || "Failed to delete tractor record." };
  }
}
