import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReceiptBuffer } from "@/lib/pdf-generator";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  console.log(`[PDF API] Received request for PDF. Type: ${type}, ID: ${id}`);

  if (!id || !type) {
    console.error("[PDF API] Missing query parameters 'id' or 'type'");
    return new NextResponse("Missing query parameters 'id' or 'type'", { status: 400 });
  }

  try {
    const upiIdSetting = await prisma.setting.findUnique({ where: { key: "UPI_ID" } });
    const merchantSetting = await prisma.setting.findUnique({ where: { key: "UPI_MERCHANT_NAME" } });

    if (type.toUpperCase() === "TRACTOR") {
      console.log(`[PDF API] Fetching TractorWork record from DB for ID: ${id}...`);
      const work = await prisma.tractorWork.findUnique({
        where: { id },
        include: {
          customer: true,
          operations: true,
        },
      });

      if (!work) {
        console.error(`[PDF API] TractorWork record not found for ID: ${id}`);
        return new NextResponse("Receipt not found", { status: 404 });
      }

      console.log(`[PDF API] Compiling Tractor PDF buffer for receipt ID: ${work.id.substring(0, 8).toUpperCase()}`);
      const buffer = await generateReceiptBuffer({
        receiptId: work.id.substring(0, 8).toUpperCase(),
        type: "TRACTOR",
        customer: {
          name: work.customer.name,
          mobile: work.customer.mobile,
          village: work.customer.village,
          address: work.customer.address,
        },
        workDetails: {
          date: new Date(work.date).toLocaleDateString(),
          operatorName: work.operatorName,
          notes: work.notes,
          operations: work.operations.map((op) => ({
            workType: op.workType,
            area: op.area,
            ratePerArea: op.ratePerArea,
            landUnit: op.landUnit,
            numberOfPasses: op.numberOfPasses,
            pricingMethod: op.pricingMethod,
            tripCount: op.tripCount,
            ratePerTrip: op.ratePerTrip,
            amount: op.amount,
          })),
          extraCharges: {
            driverCharge: work.driverCharge || 0,
            helperCharge: work.helperCharge || 0,
            foodExpense: work.foodExpense || 0,
            otherExpense: work.otherExpense || 0,
          },
          totalAmount: work.totalAmount,
          advancePaid: work.advancePaid,
          remainingBalance: work.remainingBalance,
        },
        upiId: upiIdSetting?.value,
        merchantName: merchantSetting?.value,
      });

      console.log(`[PDF API] PDF generated successfully. Buffer size: ${buffer.length} bytes.`);
      
      return new Response(buffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="receipt_tractor_${work.id.substring(0, 8).toUpperCase()}.pdf"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } else if (type.toUpperCase() === "JCB") {
      console.log(`[PDF API] Fetching JCBWork record from DB for ID: ${id}...`);
      const work = await prisma.jCBWork.findUnique({
        where: { id },
        include: {
          customer: true,
          machine: true,
        },
      });

      if (!work) {
        console.error(`[PDF API] JCBWork record not found for ID: ${id}`);
        return new NextResponse("Receipt not found", { status: 404 });
      }

      console.log(`[PDF API] Compiling JCB PDF buffer for receipt ID: ${work.id.substring(0, 8).toUpperCase()}`);
      const buffer = await generateReceiptBuffer({
        receiptId: work.id.substring(0, 8).toUpperCase(),
        type: "JCB",
        customer: {
          name: work.customer.name,
          mobile: work.customer.mobile,
          village: work.customer.village,
          address: work.customer.address,
        },
        workDetails: {
          date: new Date(work.date).toLocaleDateString(),
          operatorName: work.operatorName,
          notes: work.notes,
          totalHours: work.totalHours,
          ratePerHour: work.ratePerHour,
          dieselCost: work.dieselCost,
          totalAmount: work.totalAmount,
          advancePaid: work.advancePaid,
          remainingBalance: work.remainingBalance,
          workType: work.workType,
          pricingMethod: work.pricingMethod,
          tripCount: work.tripCount,
          ratePerTrip: work.ratePerTrip,
        },
        upiId: upiIdSetting?.value,
        merchantName: merchantSetting?.value,
      });

      console.log(`[PDF API] PDF generated successfully. Buffer size: ${buffer.length} bytes.`);

      return new Response(buffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="receipt_jcb_${work.id.substring(0, 8).toUpperCase()}.pdf"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } else {
      console.error(`[PDF API] Invalid record type: ${type}`);
      return new NextResponse("Invalid record type", { status: 400 });
    }
  } catch (error: any) {
    console.error("[PDF API] Unhandled error during PDF generation:", error);
    return new NextResponse(`Internal Server Error: ${error.message || error}`, { status: 500 });
  }
}
