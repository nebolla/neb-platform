import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient, Chain, PurchaseStatus } from "@prisma/client"
import { randomUUID } from "crypto"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const prisma = new PrismaClient()
const PROOF_DIR = "/tmp/proofs"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status: 401 })

    const form = await req.formData()
    const amountUsd = Number(form.get("amountUsd") || 0)
    const chain = String(form.get("chain") || "")
    const file = form.get("proof") as File | null

    const min = Number(process.env.PURCHASE_MIN_USD || 50)
    const max = Number(process.env.PURCHASE_MAX_USD || 50000)
    if (!amountUsd || amountUsd < min || amountUsd > max)
      return NextResponse.json({ ok:false, error:`Amount must be between ${min} and ${max}` }, { status: 400 })
    if (!file || !["TRC20","BEP20"].includes(chain))
      return NextResponse.json({ ok:false, error:"Invalid data" }, { status: 400 })

    // Save file locally (dev). Prod: S3 presigned upload.
    await mkdir(PROOF_DIR, { recursive: true })
    const id = randomUUID()
    const ext = (file.name?.split(".").pop() || "dat").toLowerCase()
    const filename = `${id}.${ext}`
    const buf = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(PROOF_DIR, filename), buf)

    const user = await prisma.user.findUnique({ where: { email: session.user.email }})
    if (!user) return NextResponse.json({ ok:false, error:"User not found" }, { status: 404 })

    const purchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        amountUsd,
        chain: chain as Chain,
        proofUrl: `/api/proofs/${filename}`,
        status: PurchaseStatus.PENDING
      }
    })

    return NextResponse.json({ ok:true, id: purchase.id })
  } catch (e:any) {
    console.error("purchase error", e)
    return NextResponse.json({ ok:false, error: e?.message || "Server error" }, { status: 500 })
  }
}
