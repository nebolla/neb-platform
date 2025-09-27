import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Chain, PurchaseStatus, Prisma } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status: 401 })

    const ct = req.headers.get("content-type") || ""
    let amount = 0, chain = "", toAddress = ""
    if (ct.includes("application/json")) {
      const b = await req.json()
      amount    = Number(b.amountReq ?? b.amountUsd ?? 0)
      chain     = String(b.chain ?? "")
      toAddress = String(b.toAddress ?? b.address ?? "")
    } else {
      const f = await req.formData()
      amount    = Number(f.get("amountReq") ?? f.get("amountUsd") ?? 0)
      chain     = String(f.get("chain") ?? "")
      toAddress = String(f.get("toAddress") ?? f.get("address") ?? "")
    }

    const min = Number(process.env.WITHDRAW_MIN_USD || 10)
    const max = Number(process.env.WITHDRAW_MAX_USD || 100000)
    if (!amount || amount < min || amount > max)
      return NextResponse.json({ ok:false, error:`Amount must be between ${min} and ${max}` }, { status: 400 })
    if (!["TRC20","BEP20"].includes(chain))
      return NextResponse.json({ ok:false, error:"Invalid chain" }, { status: 400 })
    if (!toAddress) return NextResponse.json({ ok:false, error:"Address required" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! }})
    if (!user) return NextResponse.json({ ok:false, error:"User not found" }, { status: 404 })

    const w = await prisma.wallet.findUnique({ where:{ userId_type:{ userId: user.id, type:"INCOME" }}})
    const bal = w ? new Prisma.Decimal(w.balance).toNumber() : 0
    if (bal < amount) return NextResponse.json({ ok:false, error:`Insufficient balance ($${bal})` }, { status: 400 })

    const wd = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        amountReq: amount,
        chain: chain as Chain,
        toAddress,                          // <-- schema के नाम से सेव
        status: PurchaseStatus.PENDING
      }
    })

    return NextResponse.json({ ok:true, id: wd.id })
  } catch (e:any) {
    console.error("withdraw create error", e)
    return NextResponse.json({ ok:false, error: e?.message || "Server error" }, { status: 500 })
  }
}
