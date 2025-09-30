import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient, PurchaseStatus, LedgerType, Prisma } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const prisma = new PrismaClient()
const D = (n:number)=> new Prisma.Decimal(n)

export async function POST(_: Request, ctx:{ params:{ id:string }}) {
  const session = await getServerSession(authOptions)
  if(!session || (session.user.role!=="SUPER_ADMIN" && session.user.role!=="ADMIN"))
    return NextResponse.json({ ok:false, error:"Admins only" }, { status: 401 })

  const id = ctx.params.id
  try {
    const res = await prisma.$transaction(async(tx)=>{
      const purchase = await tx.purchase.findUnique({ where:{ id }, include:{ user:true }})
      if(!purchase) throw new Error("Not found")
      if(purchase.status !== PurchaseStatus.PENDING) throw new Error("Already processed")

      // Mark approved
      await tx.purchase.update({ where:{ id }, data:{ status: PurchaseStatus.APPROVED, reviewedBy: session.user.partnerId, reviewedAt: new Date() }})

      const amt = Number(purchase.amountUsd)

      // 1) Credit NEB wallet (1 NEB = $1)
      const nebW = await tx.wallet.upsert({ where:{ userId_type:{ userId: purchase.userId, type:"NEB"}}, update:{}, create:{ userId: purchase.userId, type:"NEB"} })
      await tx.wallet.update({
        where:{ id: nebW.id },
        data:{
          balance: new Prisma.Decimal(nebW.balance).add(D(amt)),
          ledgers:{ create:{ type: LedgerType.CREDIT, amount: D(amt), event:"PurchaseApproved", meta:{ purchaseId:id } } }
        }
      })

      // 2) Pools: +2.5% VIP, +2.5% ELITE
      const vip = await tx.poolAccount.upsert({ where:{ name:"VIP" }, update:{}, create:{ name:"VIP" }})
      const elite = await tx.poolAccount.upsert({ where:{ name:"ELITE" }, update:{}, create:{ name:"ELITE" }})
      const vipAdd = amt*0.025, eliteAdd = amt*0.025
      await tx.poolAccount.update({ where:{ id: vip.id }, data:{ balance: new Prisma.Decimal(vip.balance).add(D(vipAdd)), ledgers:{ create:{ event:"ACCRUAL", amount:D(vipAdd), meta:{ purchaseId:id }}}}})
      await tx.poolAccount.update({ where:{ id: elite.id }, data:{ balance: new Prisma.Decimal(elite.balance).add(D(eliteAdd)), ledgers:{ create:{ event:"ACCRUAL", amount:D(eliteAdd), meta:{ purchaseId:id }}}}})

      // 3) MLM payouts: L1 10%, L2/L3/L4 5%
      const upline: string[] = []
      let cur = purchase.user.referrerId
      for (let i=0;i<4 && cur;i++){
        upline.push(cur)
        const next = await tx.user.findUnique({ where:{ id: cur }})
        cur = next?.referrerId || null
      }
      const perc = [0.10, 0.05, 0.05, 0.05]
      for (let i=0;i<upline.length;i++){
        const uid = upline[i]
        const payout = amt * perc[i]
        const w = await tx.wallet.upsert({ where:{ userId_type:{ userId: uid, type:"INCOME"}}, update:{}, create:{ userId: uid, type:"INCOME"} })
        await tx.wallet.update({
          where:{ id:w.id },
          data:{
            balance: new Prisma.Decimal(w.balance).add(D(payout)),
            ledgers:{ create:{ type: LedgerType.CREDIT, amount:D(payout), event:`ReferralL${i+1}`, meta:{ purchaseId:id, from: purchase.user.partnerId } } }
          }
        })
      }

      return { ok:true }
    })

    return NextResponse.json(res)
  } catch (e:any) {
    console.error("approve error", e)
    return NextResponse.json({ ok:false, error: e?.message || "Server error" }, { status: 400 })
  }
}
