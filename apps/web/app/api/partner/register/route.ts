import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { Role } from "@prisma/client"

function partnerId(){ return "NEB-" + Math.random().toString(36).slice(2,7).toUpperCase() }
function refCode(){ return Math.random().toString(36).slice(2,10).toUpperCase() }

export const runtime="nodejs"; export const dynamic="force-dynamic"

export async function POST(req:Request){
  const f = await req.formData()
  const name = String(f.get("name")||"").trim()
  const email = String(f.get("email")||"").toLowerCase().trim()
  const password = String(f.get("password")||"")
  const phone = String(f.get("phone")||"").trim()
  const address1 = String(f.get("address1")||"").trim()
  const address2 = String(f.get("address2")||"").trim()
  const city = String(f.get("city")||"").trim()
  const state = String(f.get("state")||"").trim()
  const zip = String(f.get("zip")||"").trim()
  const country = String(f.get("country")||"").trim()
  const dobStr = String(f.get("dob")||"").trim()
  const referral = String(f.get("referralCode")||"").trim()

  if(!name || !email || !password) return NextResponse.json({ ok:false, error:"Missing fields" }, { status:400 })
  const exist = await prisma.user.findUnique({ where:{ email } })
  if(exist) return NextResponse.json({ ok:false, error:"Email already registered" }, { status:400 })

  const hash = await bcrypt.hash(password, 12)
  const refUser = referral
    ? await prisma.user.findFirst({ where:{ referralCode: referral }, select:{ id:true }})
    : null

  await prisma.user.create({
    data:{
      email, name, passwordHash: hash, role: Role.PARTNER,
      partnerId: partnerId(), referralCode: refCode(), referrerId: refUser?.id ?? null,
      phone, address1, address2, city, state, zip, country,
      dob: dobStr ? new Date(dobStr) : null,
      wallets: { create: [{ type: "NEB" }, { type: "INCOME" }] }
    }
  })

  // safe redirect back to same origin
  return NextResponse.redirect(new URL("/partner/login?ok=1", req.url))
}
