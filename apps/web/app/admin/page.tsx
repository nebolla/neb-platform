import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PurchaseStatus } from "@prisma/client"

export const dynamic = "force-dynamic"

export default async function AdminPage(){
  const session = await getServerSession(authOptions)
  if(!session || (session.user.role!=="SUPER_ADMIN" && session.user.role!=="ADMIN")){
    return (<main style={{padding:"2rem"}}><p>Admins only. Please login with admin account.</p></main>)
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
            <div style={{marginTop:6}}>Proof: <a href={p.proofUrl} target="_blank">view</a></div>
            <details style={{marginTop:6}}><summary>Preview</summary>
              <img src={p.proofUrl} alt="proof" style={{maxWidth:240,border:"1px solid #eee",marginTop:6}} />
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
            <b>{w.user.partnerId}</b> • Request: ${String(w.amountReq)} • {w.chain} → { (w as any).toAddress }
            <form action={`/api/admin/withdrawals/${w.id}/approve`} method="post" style={{marginTop:8}}>
              <button style={{padding:"8px 12px", border:"1px solid #000"}}>Approve & Debit (5% fee)</button>
            </form>
          </li>
        ))}
      </ul>

      <section style={{marginTop:24}}>
        <h2>Broadcast Notification</h2>
        <form action="/api/admin/notifications" method="post" style={{marginTop:8}}>
          <input name="title" placeholder="Title" style={{display:"block",padding:8,margin:"6px 0"}} />
          <textarea name="body" placeholder="Message" rows={4} style={{display:"block",width:"100%",padding:8,margin:"6px 0"}} />
          <input type="hidden" name="audience" value="ALL" />
          <button style={{padding:"8px 12px", border:"1px solid #000"}}>Publish</button>
        </form>
      </section>
    </main>
  )
}
