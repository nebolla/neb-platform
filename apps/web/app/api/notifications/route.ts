import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const s = await getServerSession(authOptions)
  if(!s?.user?.email) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 })
  const me = await prisma.user.findUnique({ where:{ email: s.user.email }, select:{ id:true }})
  if(!me) return NextResponse.json({ ok:false, error:"User not found" }, { status:404 })

  const list = await prisma.notification.findMany({
    where:{ OR:[ {audience:"ALL"}, {audience:"USER", userId: me.id} ]},
    orderBy:{ createdAt:"desc" },
    take: 100
  })

  const read = await prisma.notificationRead.findMany({ where:{ userId: me.id }})
  const readSet = new Set(read.map(r=>r.notificationId))
  return NextResponse.json({ ok:true, items: list.map(n=>({ ...n, read: readSet.has(n.id) })) })
}
