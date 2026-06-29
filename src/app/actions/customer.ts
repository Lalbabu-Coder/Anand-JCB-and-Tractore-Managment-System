"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validation";
import { uploadImage } from "@/lib/cloudinary";

async function checkAuth(allowedRoles?: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in first.");
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new Error(`Unauthorized: Role '${session.user.role}' does not have permission.`);
  }
  return session;
}

export async function createCustomer(data: any) {
  await checkAuth(["ADMIN", "OPERATOR", "ACCOUNTANT"]);
  const validated = customerSchema.parse(data);

  try {
    let imageUrl = null;
    if (validated.imageBase64) {
      imageUrl = await uploadImage(validated.imageBase64, "anandjcb");
    }

    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        mobile: validated.mobile,
        village: validated.village,
        address: validated.address || null,
        notes: validated.notes || null,
        image: imageUrl,
      },
    });

    revalidatePath("/dashboard/customers");
    return { success: true, customer };
  } catch (error: any) {
    console.error("Create customer error:", error);
    if (error.code === "P2002") {
      return { success: false, error: "A customer with this mobile number already exists." };
    }
    return { success: false, error: error.message || "Failed to create customer." };
  }
}

export async function updateCustomer(id: string, data: any) {
  await checkAuth(["ADMIN", "OPERATOR", "ACCOUNTANT"]);
  const validated = customerSchema.parse(data);

  try {
    let imageUrl = undefined;
    if (validated.imageBase64) {
      imageUrl = await uploadImage(validated.imageBase64, "anandjcb");
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: validated.name,
        mobile: validated.mobile,
        village: validated.village,
        address: validated.address || null,
        notes: validated.notes || null,
        ...(imageUrl ? { image: imageUrl } : {}),
      },
    });

    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${id}`);
    return { success: true, customer };
  } catch (error: any) {
    console.error("Update customer error:", error);
    return { success: false, error: error.message || "Failed to update customer." };
  }
}

export async function deleteCustomer(id: string) {
  await checkAuth(["ADMIN"]);

  try {
    await prisma.customer.delete({
      where: { id },
    });

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error: any) {
    console.error("Delete customer error:", error);
    return { success: false, error: error.message || "Failed to delete customer." };
  }
}
