import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function partnerIdGen() { return "NEB-" + Math.random().toString(36).slice(2,8).toUpperCase(); }
function referralCodeGen() { return Math.random().toString(36).slice(2,10).toUpperCase(); }

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, email, password, referralCode,
      phone, addressLine1, addressLine2, city, state, postalCode, country, dateOfBirth
    } = body || {};

    if (![name,email,password,phone,addressLine1,city,state,postalCode,country,dateOfBirth].every(Boolean)) {
      return NextResponse.json({ ok:false, error:"All fields required except Address Line 2" }, { status: 400 });
    }

    const e = String(email).toLowerCase().trim();
    const exist = await prisma.user.findUnique({ where: { email: e }});
    if (exist) return NextResponse.json({ ok:false, error:"Email already exists" }, { status: 409 });

    let partnerId = partnerIdGen(); while (await prisma.user.findFirst({ where: { partnerId }})) partnerId = partnerIdGen();
    let myRef = referralCodeGen();  while (await prisma.user.findFirst({ where: { referralCode: myRef }})) myRef = referralCodeGen();

    let referrerId: string | undefined = undefined;
    if (referralCode) {
      const ref = await prisma.user.findFirst({ where: { referralCode: String(referralCode).toUpperCase() }});
      if (ref) referrerId = ref.id;
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return NextResponse.json({ ok:false, error:"Invalid Date of Birth" }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: e, name, passwordHash,
        partnerId, referralCode: myRef, role: Role.PARTNER,
        referrerId: referrerId ?? null,
        phone, addressLine1, addressLine2: addressLine2 || null,
        city, state, postalCode, country, dob,
        wallets: { create: [{ type:"NEB" }, { type:"INCOME" }] }
      }
    });

    return NextResponse.json({ ok:true, partnerId: user.partnerId, referralCode: user.referralCode });
  } catch (e:any) {
    console.error("register error", e);
    return NextResponse.json({ ok:false, error: e?.message || "Server error" }, { status: 500 });
  }
}
