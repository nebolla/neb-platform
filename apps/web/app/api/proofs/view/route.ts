import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInlineViewUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return NextResponse.json({ ok:false, error:"key missing" }, { status: 400 });

  // current user
  const me = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true },
  });
  if (!me) return NextResponse.json({ ok:false, error:"User not found" }, { status: 404 });

  // key का owner कौन है?
  const p = await prisma.purchase.findFirst({
    where: { proofKey: key },
    select: { userId: true },
  });
  if (!p) return NextResponse.json({ ok:false, error:"Proof not found" }, { status: 404 });

  const isAdmin = me.role === "ADMIN" || me.role === "SUPER_ADMIN";
  if (!isAdmin && p.userId !== me.id) {
    return NextResponse.json({ ok:false, error:"Forbidden" }, { status: 403 });
  }

  const signed = await getInlineViewUrl(key);
  return NextResponse.redirect(signed, 302);
}
