import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function Dashboard(){
  const session = (await getServerSession(authOptions)) as import("next-auth").Session | null
  if(!session || !session.user){
    return (<main style={{padding:"2rem"}}><p>Please <a href="/partner/login">login</a>.</p></main>)
  }

  const u = await prisma.user.findUnique({
    where:{ email: session.user.email! },
    include:{ wallets:true }
  })
  if(!u){
    return (<main style={{padding:"2rem"}}><p>User not found.</p></main>)
  }

  const getBal = (t:string)=> Number(u.wallets.find((w:any)=>w.type===t)?.balance ?? 0)
  const nebBal = getBal("NEB")
  const incomeBal = getBal("INCOME")

  const minW = Number(process.env.WITHDRAW_MIN_USD || 10)
  const maxW = Number(process.env.WITHDRAW_MAX_USD || 100000)

  return (
    <main style={{padding:"2rem", fontFamily:"ui-sans-serif"}}>
      <h1>Welcome, <b>{u.partnerId}</b></h1>
      <p>NEB Wallet: <b>${nebBal}</b> &nbsp; | &nbsp; Income Wallet: <b>${incomeBal}</b></p>
      <p>
        Referral Code: <b>{u.referralCode}</b>
        { " • " }
        Referral Link: <code>{`${process.env.APP_URL ?? ""}/partner/register?ref=${u.referralCode}`}</code>
      </p>

      <section style={{marginTop:24}}>
        <h2>Buy NEB</h2>
        <p>Send USDT to one of the addresses, then upload proof. <b>1 NEB = $1</b>.</p>
        <div style={{margin:'8px 0'}}>
          <div>TRC20: <code>TEP8dnZ4HRYSaqgjWtKjkrRAnBe5WcoEvP</code></div>
          <div>BEP20: <code>0xB10e828A75eA63795233450EBFFcd521A5b7924E</code></div>
        </div>
        <form action="/api/purchases" method="post" encType="multipart/form-data" style={{marginTop:12}}>
          <label>Amount (USD)</label>
          <input name="amountUsd" type="number" min={1} step="0.01" required style={{display:"block",padding:8,margin:"6px 0 12px"}} />
          <label>Chain</label>
          <select name="chain" required style={{display:"block",padding:8,margin:"6px 0 12px"}}>
            <option value="TRC20">TRC20</option>
            <option value="BEP20">BEP20</option>
          </select>
          <label>Upload Proof (screenshot/pdf)</label>
          <input name="proof" type="file" accept="image/*,application/pdf" required style={{display:"block",margin:"6px 0 12px"}} />
          <button style={{padding:"8px 12px", border:"1px solid #000"}}>Submit Purchase</button>
        </form>
      </section>

      <section style={{marginTop:32}}>
        <h2>Withdraw from Income Wallet</h2>
        <p style={{fontSize:12,opacity:.8}}>Limits: ${minW} – ${maxW}. 5% service charge applies (credited to Service Fee Pool). Admin will transfer to your wallet after approval.</p>
        <form action="/api/withdrawals" method="post" style={{marginTop:12}}>
          <label>Amount (USD)</label>
          <input name="amountReq" type="number" min={minW} max={maxW} step="0.01" required style={{display:"block",padding:8,margin:"6px 0 12px"}} />
          <label>Chain</label>
          <select name="chain" required style={{display:"block",padding:8,margin:"6px 0 12px"}}>
            <option value="TRC20">TRC20</option>
            <option value="BEP20">BEP20</option>
          </select>
          <label>Destination Wallet Address</label>
          <input name="toAddress" placeholder="Your TRC20 or BEP20 address" required style={{display:"block",width:"100%",padding:8,margin:"6px 0 12px"}} />
          <button style={{padding:"8px 12px", border:"1px solid #000"}}>Request Withdrawal</button>
        </form>
      </section>

      <p style={{marginTop:24}}><a href="/admin">Go to Admin (for admins)</a></p>
      <p style={{marginTop:8}}><a href="/dashboard/team">View My Team (Genealogy)</a></p>
      <p style={{marginTop:4}}><a href="/dashboard/notifications">Notifications</a></p>
    </main>
  )
}
