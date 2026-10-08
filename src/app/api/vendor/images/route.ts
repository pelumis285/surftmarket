import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { currentUser, hasRole, recordAudit } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = 42 * 1024 * 1024;

type SupportedImage = { extension: "jpg" | "png" | "webp" | "gif"; mime: string };

function detectImage(bytes: Uint8Array): SupportedImage | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", mime: "image/jpeg" };
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return { extension: "png", mime: "image/png" };
  }
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return { extension: "webp", mime: "image/webp" };
  }
  if (bytes.length >= 6) {
    const signature = String.fromCharCode(...bytes.slice(0, 6));
    if (signature === "GIF87a" || signature === "GIF89a") return { extension: "gif", mime: "image/gif" };
  }
  return null;
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return errorResponse("Sign in to upload product images.", 401);
  if (!hasRole(user, ["vendor", "admin"])) return errorResponse("Only vendor accounts can upload product images.", 403);
  if (user.role === "vendor" && !user.verified) return errorResponse("Your vendor account must be approved before uploading images.", 403);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) return errorResponse("The selected images are too large. Upload no more than eight 5 MB images.", 413);

  const formData = await request.formData().catch(() => null);
  if (!formData) return errorResponse("The image upload could not be read.", 400);
  const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (!files.length) return errorResponse("Choose at least one image.", 400);
  if (files.length > MAX_IMAGES) return errorResponse(`Upload no more than ${MAX_IMAGES} images at once.`, 400);

  const validated: { bytes: Uint8Array; format: SupportedImage }[] = [];
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) return errorResponse(`${file.name || "An image"} is larger than 5 MB.`, 413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const format = detectImage(bytes);
    if (!format) return errorResponse(`${file.name || "A file"} is not a supported JPG, PNG, WebP, or GIF image.`, 415);
    validated.push({ bytes, format });
  }

  const relativeDirectory = path.posix.join("uploads", "vendor-products", user.id);
  const targetDirectory = path.join(process.cwd(), "public", ...relativeDirectory.split("/"));
  await mkdir(targetDirectory, { recursive: true });

  const images = await Promise.all(validated.map(async ({ bytes, format }) => {
    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${format.extension}`;
    await writeFile(path.join(targetDirectory, filename), bytes, { flag: "wx" });
    return { url: `/${relativeDirectory}/${filename}`, mime: format.mime, size: bytes.byteLength };
  }));

  try {
    await recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "vendor.product_images.upload",
      entity: "product_image",
      meta: { count: images.length, totalBytes: images.reduce((total, image) => total + image.size, 0) },
    });
  } catch (error) {
    console.error("Unable to record product image upload audit", error);
  }

  return NextResponse.json({ ok: true, images }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
