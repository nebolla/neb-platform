import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
export const s3 = new S3Client({ region });

function inferMime(key: string) {
  const k = key.toLowerCase();
  if (k.endsWith(".pdf")) return "application/pdf";
  if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(k)) return "image/*";
  return "application/octet-stream";
}

export async function getInlineViewUrl(key: string) {
  const Bucket = process.env.S3_BUCKET!;
  const ContentType = inferMime(key);
  const cmd = new GetObjectCommand({
    Bucket,
    Key: key,
    ResponseContentDisposition: "inline",
    ResponseContentType: ContentType,
  });
  return await getSignedUrl(s3, cmd, { expiresIn: 60 * 3 });
}
