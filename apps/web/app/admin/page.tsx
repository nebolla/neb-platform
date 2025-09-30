import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import Link from "next/link"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PurchaseStatus } from "@prisma/client"

export const dynamic = "force-dynamic"

export default async function AdminPage(){
  const session = (await getServerSession(authOptions)) as Session | null
  const isAdmin = !!(session?.user && (session.user as any).role && ((session.user as any).role === "SUPER_ADMIN" || (session.user as any).role === "ADMIN"))

  if(!isAdmin){
    return (
      <main style={{padding:"2rem"}}>
        <p>Admins only. Please login with admin account.</p>
      </main>
    )
  }

  const [purchases, withdrawals, vip, elite, wfee] = await Promise.all([
    prisma.purchase.findMany({
      where:{ status: PurchaseStatus.PENDING },
      include:{ user:true },
      orderBy:{ createdAt:"desc" }
    }),
    prisma.withdrawal.findMany({
      where:{ status: PurchaseStatus.PENDING },
      include:{ user:true },
      orderBy:{ createdAt:"desc" }
    }),
    prisma.poolAccount.findUnique({ where:{ name:"VIP" }}),
    prisma.poolAccount.findUnique({ where:{ name:"ELITE" }}),
    prisma.poolAccount.findUnique({ where:{ name:"WITHDRAWAL_FEE" }}),
  ])

  return (
    <main style={{padding:"2rem", fontFamily:"ui-sans-serif"}}>
      <p style={{ marginTop: 8 }}>
        <Link href="/admin/pools">Pools (VIP/ELITE)</Link>
      </p>

      <h1>Approvals Queue</h1>
      <p style={{margin:"8px 0"}}>
        VIP Pool: ${String(vip?.balance||0)} &nbsp; | &nbsp;
        ELITE Pool: ${String(elite?.balance||0)} &nbsp; | &nbsp;
        Service Fee Pool: ${String(wfee?.balance||0)}
      </p>

      <h2>Purchases</h2>
      {purchases.length===0 && <p>No pending purchases.</p>}
      <ul>
        {purchases.map(p=>(
          <li key={p.id} style={{border:"1px solid #ddd", padding:12, margin:"12px 0"}}>
            <b>{p.user.partnerId}</b> • ${String(p.amountUsd)} • {p.chain}
            <div style={{marginTop:6}}>Proof: <a href={`/api/proofs/view?key=${encodeURIComponent((p as any).proofKey || '')}`} target="_blank">view</a></div>
            <details style={{marginTop:6}}><summary>Preview</summary>
              <img src={`/api/proofs/view?key=${encodeURIComponent((p as any).proofKey || '')}`} alt="proof" style={{maxWidth:240,border:"1px solid #eee",marginTop:6}} />
            </details>
            <form action={`/api/admin/purchases/${p.id}/approve`} method="post" style={{marginTop:8}}>
              <button style={{padding:"8px 12px", border:"1px solid #000"}}>Approve</button>
            </form>
          </li>
        ))}
      </ul>

      <h2>Withdrawals</h2>
      {withdrawals.length===0 && <p>No pending withdrawals.</p>}
      <ul>
        {withdrawals.map(w=>(
          <li key={w.id} style={{border:"1px solid #ddd", padding:12, margin:"12px 0"}}>
            <b>{w.user.partnerId}</b> • Request: ${String((w as any).amountReq)} • {w.chain} → {(w as any).toAddress}
            <form action={`/api/admin/withdrawals/${w.id}/approve`} method="post" style={{marginTop:8}}>
              <button style={{padding:"8px 12px", border:"1px solid #000"}}>Approve & Debit (5% fee)</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  )
}
