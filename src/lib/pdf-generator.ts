import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptPDF, ReceiptPDFProps } from "@/components/ReceiptPDF";
import { uploadReceiptPDF } from "@/lib/cloudinary";

export async function generateAndUploadReceipt(props: Omit<ReceiptPDFProps, "qrCodeDataUrl"> & { upiId?: string; merchantName?: string }): Promise<string> {
  const { upiId, merchantName, ...restProps } = props;

  // 1. Generate UPI Payment URL & QR Code API Link
  let qrCodeUrl = "";
  if (upiId && restProps.workDetails.remainingBalance > 0) {
    const name = merchantName || "Anand JCB & Tractor";
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${restProps.workDetails.remainingBalance}&cu=INR`;
    // We use public qrserver API to render the QR code inside react-pdf Image tag
    qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  }

  // 2. Render PDF to Buffer
  try {
    const doc = React.createElement(ReceiptPDF, {
      ...restProps,
      qrCodeDataUrl: qrCodeUrl || undefined,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(doc as any);

    const fileName = `receipt_${props.type.toLowerCase()}_${props.receiptId}.pdf`;

    // 3. Upload buffer (Cloudinary or local filesystem fallback)
    const savedUrl = await uploadReceiptPDF(buffer, fileName);
    return savedUrl;
  } catch (error) {
    console.error("PDF Compilation/Upload failed:", error);
    throw new Error("Failed to generate PDF receipt");
  }
}
