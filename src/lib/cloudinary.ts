import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a PDF buffer to Cloudinary, or saves it locally in public/receipts as fallback.
 * @returns The URL of the saved file
 */
export async function uploadReceiptPDF(buffer: Buffer, fileName: string): Promise<string> {
  // Cloudinary blocks PDF delivery by default on new accounts (returns HTTP 401).
  // To prevent the user from getting stuck, we force local storage.
  // The PDF will be saved to public/receipts/ and served natively by Next.js.
  return saveLocally(buffer, fileName);
}

async function saveLocally(buffer: Buffer, fileName: string): Promise<string> {
  const dirPath = path.join(process.cwd(), "public", "receipts");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, fileName);
  fs.writeFileSync(filePath, buffer);

  // Return relative URL for local serving
  return `/receipts/${fileName}`;
}

/**
 * Uploads a base64 image string to Cloudinary.
 * @returns The secure URL of the uploaded image.
 */
export async function uploadImage(base64Data: string, folder: string = "anandjcb"): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary is not configured");
  }
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Data,
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary image upload failed:", error);
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Cloudinary image upload returned empty result"));
        }
      }
    );
  });
}
