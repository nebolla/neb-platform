import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime="nodejs"; export const dynamic="force-dynamic"

export async function POST(_:Request, ctx:{ params:{ id:string } }){
  const s = await getServerSession(authOptions)
  if(!s?.user?.email) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 })
  const me = await prisma.user.findUnique({ where:{ email: s.user.email }, select:{ id:true }})
  if(!me) return NextResponse.json({ ok:false, error:"User not found" }, { status:404 })
  await prisma.notificationRead.upsert({
    where:{ userId_notificationId:{ userId:me.id, notificationId: ctx.params.id }},
    update:{},
    create:{ userId:me.id, notificationId:ctx.params.id }
  })
  return NextResponse.json({ ok:true })
}
