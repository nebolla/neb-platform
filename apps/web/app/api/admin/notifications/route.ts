import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime="nodejs"; export const dynamic="force-dynamic"

export async function POST(req:Request){
  const s = await getServerSession(authOptions)
  if(!s || (s.user.role!=="SUPER_ADMIN" && s.user.role!=="ADMIN"))
    return NextResponse.json({ ok:false, error:"Admins only" }, { status:401 })
  const b = await req.json().catch(()=>({}))
  const title = String(b.title||"").trim()
  const body = String(b.body||"").trim()
  const audience = String(b.audience||"ALL")
  const userId = b.userId ? String(b.userId) : null
  if(!title || !body) return NextResponse.json({ ok:false, error:"title/body required" }, { status:400 })
  const n = await prisma.notification.create({ data:{ title, body, audience: audience==="USER"?"USER":"ALL", userId: audience==="USER"?userId:null }})
  return NextResponse.json({ ok:true, id:n.id })
}
