import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "brightsums";

const r2Configured = Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);

const client = r2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

// Local filesystem fallback for dev before R2 credentials are configured —
// see the plan's "open technical risks" #6. NEVER used in the Cloudflare
// Workers deployment (no persistent fs there); once R2_* env vars are set,
// this branch is dead code in every environment.
const LOCAL_UPLOAD_DIR = path.resolve(process.cwd(), ".local-uploads");

export function makeObjectKey(userId: string, fileName: string) {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "bin";
  return `document-verifications/${userId}/${randomUUID()}.${ext}`;
}

export async function uploadObject(key: string, data: Buffer, contentType: string) {
  if (client) {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: data,
        ContentType: contentType,
      })
    );
    return;
  }

  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
}

export async function readObject(key: string): Promise<{ data: Buffer; contentType?: string } | null> {
  if (client) {
    try {
      const res = await client.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes) return null;
      return { data: Buffer.from(bytes), contentType: res.ContentType };
    } catch {
      return null;
    }
  }

  try {
    const filePath = path.join(LOCAL_UPLOAD_DIR, key);
    const data = await readFile(filePath);
    return { data };
  } catch {
    return null;
  }
}

export const isR2Configured = r2Configured;
