import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime="nodejs"; export const dynamic="force-dynamic"

export async function POST(req:Request){
  const s = await getServerSession(authOptions)
  if(!s || (s.user.role!=="SUPER_ADMIN" && s.user.role!=="ADMIN"))
    return NextResponse.json({ ok:false, error:"Admins only" }, { status:401 })

  let title="", body="", audience="ALL", userId: string|null = null
  const ct = req.headers.get('content-type') || ""
  if (ct.includes('application/json')) {
    const b = await req.json().catch(()=>({}))
    title = String(b.title||"").trim()
    body = String(b.body||"").trim()
    audience = String(b.audience||"ALL").trim()
    userId = b.userId ? String(b.userId) : null
  } else {
    const f = await req.formData()
    title = String(f.get('title')||"").trim()
    body = String(f.get('body')||"").trim()
    audience = String(f.get('audience')||"ALL").trim()
    const u = f.get('userId'); userId = u ? String(u) : null
  }
  if(!title || !body) return NextResponse.json({ ok:false, error:"title/body required" }, { status:400 })

  const n = await prisma.notification.create({
    data:{ title, body, audience: audience==="USER"?"USER":"ALL", userId: audience==="USER" ? userId : null }
  })
  return NextResponse.json({ ok:true, id:n.id })
}
