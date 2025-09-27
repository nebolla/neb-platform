import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PurchaseStatus } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if(!session?.user?.email) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 })

  // me
  const me = await prisma.user.findUnique({
    where:{ email: session.user.email! },
    select:{ id:true, partnerId:true, referralCode:true, name:true }
  })
  if(!me) return NextResponse.json({ ok:false, error:"User not found" }, { status:404 })

  // BFS downline (maxDepth=8, maxNodes=1000)
  const maxDepth=8, maxNodes=1000
  const nodes: any[] = [{ id: me.id, label: me.partnerId, depth:0 }]
  const edges: any[] = []
  const byDepth: Record<number, string[]> = { 0:[me.id] }

  let q: {id:string, depth:number}[] = [{ id: me.id, depth:0 }]
  const seen = new Set<string>([me.id])

  while(q.length && nodes.length < maxNodes){
    const cur = q.shift()!
    if(cur.depth >= maxDepth) continue
    const kids = await prisma.user.findMany({
      where:{ referrerId: cur.id },
      select:{ id:true, partnerId:true }
    })
    for(const k of kids){
      if(seen.has(k.id)) continue
      seen.add(k.id)
      const depth = cur.depth + 1
      nodes.push({ id:k.id, label:k.partnerId, depth })
      edges.push({ id:`${cur.id}-${k.id}`, source:cur.id, target:k.id })
      byDepth[depth] = byDepth[depth] || []
      byDepth[depth].push(k.id)
      q.push({ id:k.id, depth })
      if(nodes.length >= maxNodes) break
    }
  }

  // L1-L4 earnings: sum APPROVED purchases volume at each depth, apply 10% / 5%
  const levels: any = {}
  for(let d=1; d<=4; d++){
    const ids = byDepth[d] || []
    if(!ids.length){ levels[d]={ members:0, volume:0, income:0 }; continue }
    const volAgg = await prisma.purchase.aggregate({
      _sum:{ amountUsd:true },
      where:{ userId:{ in: ids }, status: PurchaseStatus.APPROVED }
    })
    const volume = Number(volAgg._sum.amountUsd || 0)
    const rate = d===1 ? 0.10 : 0.05
    const income = Number((volume*rate).toFixed(2))
    levels[d] = { members: ids.length, volume, income }
  }

  return NextResponse.json({
    ok:true,
    me:{ id:me.id, partnerId:me.partnerId, name: me.name ?? "" },
    levels,
    totals:{
      members: Object.values(byDepth).reduce((a:any,arr:any)=>a+(arr?.length||0),0)-1,
      volume: Object.values(levels).reduce((a:any,l:any)=>a+l.volume,0),
      income: Object.values(levels).reduce((a:any,l:any)=>a+l.income,0)
    },
    tree:{ nodes, edges }
  })
}
