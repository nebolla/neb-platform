import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // DB ping
    const [row] = await prisma.$queryRaw<{ now: Date }[]>`SELECT now() AS now`;
    // कुछ बेसिक काउंट
    const users = await prisma.user.count();
    const pools = await prisma.poolAccount.count();

    return NextResponse.json({
      ok: true,
      dbTime: row?.now ?? null,
      users,
      pools
    });
  } catch (e: any) {
    // 500 की जगह JSON दे दें ताकि ब्राउज़र "This page isn’t working" न दे
    return NextResponse.json(
      { ok: false, error: e?.message || "health failed" },
      { status: 200 }
    );
  }
}
