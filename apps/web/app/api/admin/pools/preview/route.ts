import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PurchaseStatus } from "@prisma/client"

export const runtime="nodejs"; export const dynamic="force-dynamic"

async function descendants(rootId:string){
  const out:string[]=[]; let q=[rootId];
  while(q.length){
    const parents=q; q=[]
    const kids = await prisma.user.findMany({ where:{ referrerId: { in: parents }}, select:{ id:true }})
    for(const k of kids){ out.push(k.id); q.push(k.id) }
  }
  return out
}
async function subtreeVolume(rootId:string){
  const ids=[rootId, ...(await descendants(rootId))]
  const agg = await prisma.purchase.aggregate({
    where:{ userId:{ in: ids }, status: PurchaseStatus.APPROVED },
    _sum:{ amountUsd:true }
  })
  return Number(agg._sum.amountUsd||0)
}
async function countedWithCap(userId:string, threshold:number){
  const cap = threshold*0.25
  const legs = await prisma.user.findMany({ where:{ referrerId:userId }, select:{ id:true, partnerId:true }})
  let counted = 0; const details:any[]=[]
  for(const lg of legs){
    const vol = await subtreeVolume(lg.id)
    const cnt = Math.min(vol, cap); counted += cnt
    details.push({ partnerId: lg.partnerId, raw: vol, counted: cnt })
  }
  return { legs: details, counted }
}

export async function GET(){
  const s = await getServerSession(authOptions)
  if(!s || (s.user.role!=="SUPER_ADMIN" && s.user.role!=="ADMIN"))
    return NextResponse.json({ ok:false, error:"Admins only" }, { status:401 })

  const VIP_T=100000, ELITE_T=500000
  const [vipPool, elitePool] = await Promise.all([
    prisma.poolAccount.findUnique({ where:{ name:"VIP" }}),
    prisma.poolAccount.findUnique({ where:{ name:"ELITE" }})
  ])
  const users = await prisma.user.findMany({ select:{ id:true, partnerId:true }})
  const vipElig:any[]=[], eliteElig:any[]=[]

  for(const u of users){
    const legs = await prisma.user.count({ where:{ referrerId:u.id }})
    if(legs>=4){
      const v = await countedWithCap(u.id, VIP_T)
      if(v.counted>=VIP_T) vipElig.push({ partnerId:u.partnerId, counted:v.counted })
      const e = await countedWithCap(u.id, ELITE_T)
      if(e.counted>=ELITE_T) eliteElig.push({ partnerId:u.partnerId, counted:e.counted })
    }
  }

  const vipPoolBal = Number(vipPool?.balance||0)
  const elitePoolBal = Number(elitePool?.balance||0)

  return NextResponse.json({
    ok:true,
    vip:{ pool: vipPoolBal, eligible: vipElig.length, share: vipElig.length? +(vipPoolBal/vipElig.length).toFixed(2):0, members: vipElig.slice(0,50) },
    elite:{ pool: elitePoolBal, eligible: eliteElig.length, share: eliteElig.length? +(elitePoolBal/eliteElig.length).toFixed(2):0, members: eliteElig.slice(0,50) }
  })
}
