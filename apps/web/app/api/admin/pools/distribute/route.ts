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
async function eligible(threshold:number){
  const cap = threshold*0.25
  const users = await prisma.user.findMany({ select:{ id:true }})
  const out:string[]=[]
  for(const u of users){
    const legs = await prisma.user.findMany({ where:{ referrerId:u.id }, select:{ id:true }})
    if(legs.length<4) continue
    let counted=0
    for(const lg of legs){
      const vol = await subtreeVolume(lg.id)
      counted += Math.min(vol, cap)
    }
    if(counted>=threshold) out.push(u.id)
  }
  return out
}

export async function POST(req:Request){
  const s = await getServerSession(authOptions)
  if(!s || (s.user.role!=="SUPER_ADMIN" && s.user.role!=="ADMIN"))
    return NextResponse.json({ ok:false, error:"Admins only" }, { status:401 })

  const ct = req.headers.get('content-type') || ''
  let pool = 'VIP'
  if(ct.includes('application/json')){
    const b = await req.json().catch(()=>({}))
    pool = String(b.pool||'VIP').toUpperCase()
  }else{
    const f = await req.formData().catch(()=>null)
    pool = String(f?.get('pool')||'VIP').toUpperCase()
  }
  const THRESH = pool==='ELITE' ? 500000 : 100000

  const res = await prisma.$transaction(async(tx)=>{
    const p = await tx.poolAccount.findUnique({ where:{ name: pool }})
    const bal = Number(p?.balance||0)
    if(bal<=0) return { ok:false, error:'Pool empty' }

    const members = await eligible(THRESH)
    if(!members.length) return { ok:false, error:'No eligible members' }

    const share = Math.floor((bal/members.length)*100)/100
    const total = share * members.length

    // credit income wallet + notification
    for(const uid of members){
      const w = await tx.wallet.upsert({ where:{ userId_type:{ userId:uid, type:'INCOME'}}, update:{}, create:{ userId:uid, type:'INCOME'} })
      await tx.wallet.update({ where:{ id:w.id }, data:{ balance:{ increment: share } } })
      await tx.notification.create({ data:{ title:`${pool} Pool Payout`, body:`You received $${share}.`, audience:'USER', userId: uid }})
    }

    await tx.poolAccount.update({ where:{ id: p!.id }, data:{ balance:{ decrement: total } }})

    return { ok:true, pool, members: members.length, share, totalPaid: total }
  })

  return NextResponse.json(res)
}
