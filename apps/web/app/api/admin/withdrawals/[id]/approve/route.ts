import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PurchaseStatus, LedgerType, Prisma } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const D = (n:number)=> new Prisma.Decimal(n)

export async function POST(_: Request, ctx:{ params:{ id:string }}) {
  const session = await getServerSession(authOptions)
  if(!session || (session.user.role!=="SUPER_ADMIN" && session.user.role!=="ADMIN"))
    return NextResponse.json({ ok:false, error:"Admins only" }, { status: 401 })

  const id = ctx.params.id
  try {
    const res = await prisma.$transaction(async(tx)=>{
      const wd = await tx.withdrawal.findUnique({ where:{ id }, include:{ user:true }})
      if(!wd) throw new Error("Not found")
      if(wd.status !== PurchaseStatus.PENDING) throw new Error("Already processed")

      // Requested amount
      const amt = new Prisma.Decimal(wd.amountReq as any).toNumber()
      const fee = Number((amt * 0.05).toFixed(2))
      const net = Number((amt - fee).toFixed(2))

      // Income wallet check
      const w = await tx.wallet.upsert({ where:{ userId_type:{ userId: wd.userId, type:"INCOME"}}, update:{}, create:{ userId: wd.userId, type:"INCOME"} })
      const cur = new Prisma.Decimal(w.balance).toNumber()
      if (cur < amt) throw new Error(`Insufficient balance: ${cur}`)

      // 1) Mark APPROVED + fill processedBy/At + amounts
      await tx.withdrawal.update({
        where:{ id },
        data:{
          status: PurchaseStatus.APPROVED,
          processedBy: session.user.partnerId,     // <-- reviewedBy → processedBy
          processedAt: new Date(),                 // <-- reviewedAt → processedAt
          amountPaid: D(net),
          feeAmount: D(fee)
        }
      })

      // 2) Debit user's INCOME wallet by full requested amount
      await tx.wallet.update({
        where:{ id: w.id },
        data:{
          balance: new Prisma.Decimal(w.balance).sub(D(amt)),
          ledgers:{ create:{ type: LedgerType.DEBIT, amount: D(amt), event:"Withdrawal",
            meta:{ withdrawalId:id, chain: wd.chain, address: (wd as any).toAddress, fee, net } } }
        }
      })

      // 3) Credit WITHDRAWAL_FEE pool by the 5% fee
      const feePool = await tx.poolAccount.upsert({ where:{ name:"WITHDRAWAL_FEE" }, update:{}, create:{ name:"WITHDRAWAL_FEE" }})
      await tx.poolAccount.update({
        where:{ id: feePool.id },
        data:{
          balance: new Prisma.Decimal(feePool.balance).add(D(fee)),
          ledgers:{ create:{ event:"WITHDRAWAL_FEE", amount:D(fee), meta:{ withdrawalId:id, user: wd.user.partnerId } } }
        }
      })

      // On-chain भेजना admin मैन्युअली करेगा; यहां रिकॉर्ड/लेजर अपडेट हैं
      return { ok:true, netPaid: net, fee }
    })

    return NextResponse.json(res)
  } catch (e:any) {
    console.error("withdraw approve error", e)
    return NextResponse.json({ ok:false, error: e?.message || "Server error" }, { status: 400 })
  }
}
