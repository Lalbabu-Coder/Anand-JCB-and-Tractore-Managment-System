"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jcbWorkSchema } from "@/lib/validation";
import { generateAndUploadReceipt } from "@/lib/pdf-generator";
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

export async function createJcbWork(data: any) {
  await checkAuth(["ADMIN", "OPERATOR"]);

  const validated = jcbWorkSchema.parse(data);

  // 1. Calculate hours and totals
  const start = new Date(validated.startTime);
  const end = new Date(validated.endTime);
  const totalHours = Math.max(0.1, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
  
  const totalAmount = Math.round(totalHours * validated.ratePerHour);
  const remainingBalance = Math.max(0, totalAmount - validated.advancePaid);

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });
    if (!customer) throw new Error("Customer not found");

    // 2. Save work log
    const work = await prisma.jCBWork.create({
      data: {
        customerId: validated.customerId,
        machineId: validated.machineId,
        date: new Date(validated.date),
        startTime: start,
        endTime: end,
        totalHours,
        ratePerHour: validated.ratePerHour,
        totalAmount,
        dieselCost: validated.dieselCost,
        operatorName: validated.operatorName,
        advancePaid: validated.advancePaid,
        remainingBalance,
        notes: validated.notes || null,
      },
    });

    // 3. Get settings for PDF / SMS
    const upiIdSetting = await prisma.setting.findUnique({ where: { key: "UPI_ID" } });
    const merchantSetting = await prisma.setting.findUnique({ where: { key: "UPI_MERCHANT_NAME" } });
    const smsTemplateSetting = await prisma.setting.findUnique({ where: { key: "SMS_TEMPLATE_JCB" } });

    // 4. Generate PDF receipt and upload
    let pdfUrl = "";
    try {
      pdfUrl = await generateAndUploadReceipt({
        receiptId: work.id.substring(0, 8).toUpperCase(),
        type: "JCB",
        customer: {
          name: customer.name,
          mobile: customer.mobile,
          village: customer.village,
          address: customer.address,
        },
        workDetails: {
          date: new Date(validated.date).toLocaleDateString(),
          operatorName: validated.operatorName,
          notes: validated.notes,
          totalHours,
          ratePerHour: validated.ratePerHour,
          dieselCost: validated.dieselCost,
          totalAmount,
          advancePaid: validated.advancePaid,
          remainingBalance,
        },
        upiId: upiIdSetting?.value,
        merchantName: merchantSetting?.value,
      });

      // Update JCBWork with pdfUrl
      await prisma.jCBWork.update({
        where: { id: work.id },
        data: { pdfUrl }
      });
    } catch (pdfErr) {
      console.error("Failed to generate PDF for work:", pdfErr);
    }

    // 5. Send notifications (SMS & WhatsApp)
    let smsSent = false;
    let waSent = false;
    let smsError = "";

    const rawTemplate = smsTemplateSetting?.value || 
      "Namaste {customerName},\nYour JCB work has been completed.\nHours: {hours}\nRate: ₹{rate}/hour\nTotal: ₹{total}\nAdvance: ₹{advance}\nRemaining: ₹{remaining}\nThank you.";

    const smsBody = parseTemplate(rawTemplate, {
      customerName: customer.name,
      hours: totalHours.toFixed(1),
      rate: validated.ratePerHour,
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

    const waRes = await sendWhatsApp(customer.mobile, smsBody, pdfUrl || undefined);
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
    revalidatePath("/dashboard/jcb");
    revalidatePath(`/dashboard/customers/${customer.id}`);
    
    return { 
      success: true, 
      work, 
      pdfUrl, 
      notifications: { smsSent, waSent, smsError } 
    };
  } catch (error: any) {
    console.error("Create JCB work error:", error);
    return { success: false, error: error.message || "Failed to log JCB work." };
  }
}

export async function deleteJcbWork(id: string) {
  await checkAuth(["ADMIN"]);

  try {
    await prisma.jCBWork.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/jcb");
    return { success: true };
  } catch (error: any) {
    console.error("Delete JCB work error:", error);
    return { success: false, error: error.message || "Failed to delete JCB record." };
  }
}
