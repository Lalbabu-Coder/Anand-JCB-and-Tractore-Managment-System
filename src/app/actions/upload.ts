"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

export async function uploadEntityImage(entityType: "USER" | "CUSTOMER" | "MACHINE", entityId: string, base64Image: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  try {
    const imageUrl = await uploadImage(base64Image, "anandjcb");

    if (entityType === "USER") {
      await prisma.user.update({
        where: { email: session.user.email || "" },
        data: { profilePic: imageUrl },
      });
      revalidatePath("/dashboard/admin");
    } else if (entityType === "CUSTOMER") {
      await prisma.customer.update({
        where: { id: entityId },
        data: { image: imageUrl },
      });
      revalidatePath(`/dashboard/customers/${entityId}`);
      revalidatePath("/dashboard/customers");
    } else if (entityType === "MACHINE") {
      await prisma.machine.update({
        where: { id: entityId },
        data: { image: imageUrl },
      });
      revalidatePath("/dashboard/admin");
    }

    return { success: true, imageUrl };
  } catch (error: any) {
    console.error("Failed to upload image:", error);
    return { success: false, error: error.message || "Upload failed" };
  }
}
