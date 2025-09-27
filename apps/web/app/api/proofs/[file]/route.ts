import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Simple extension → MIME map
const MIME: Record<string,string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  heic: "image/heic",
  heif: "image/heif",
  tiff: "image/tiff",
  tif: "image/tiff",
  avif: "image/avif"
}

export async function GET(_: Request, ctx: { params: { file: string }}) {
  try {
    const file = ctx.params.file
    const full = path.join("/tmp/proofs", file)
    const data = await readFile(full)

    const ext = (file.split(".").pop() || "").toLowerCase()
    const type = MIME[ext] ?? "application/octet-stream"

    const headers = new Headers({
      "Content-Type": type,
      // ⬇️ Force inline render in browser (no download)
      "Content-Disposition": `inline; filename="${encodeURIComponent(file)}"`,
      "Cache-Control": "private, max-age=3600"
    })

    return new NextResponse(data, { headers })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}
