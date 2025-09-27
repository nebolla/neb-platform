import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function Notifs(){
  const s = await getServerSession(authOptions)
  if(!s) return (<main style={{padding:"2rem"}}><p>Please <a href="/partner/login">login</a>.</p></main>)
  const r = await fetch(`${process.env.APP_URL}/api/notifications`, { cache:'no-store' })
  const j = await r.json()
  return (
    <main style={{padding:"2rem"}}>
      <h2>Notifications</h2>
      {!j.ok && <p style={{color:'crimson'}}>{j.error}</p>}
      {(j.items||[]).map((n:any)=>(
        <div key={n.id} style={{border:'1px solid #eee', padding:12, margin:'10px 0', background:n.read?'#fafafa':'#fff'}}>
          <div style={{fontWeight:700}}>{n.title}</div>
          <div style={{fontSize:14, color:'#444', whiteSpace:'pre-wrap'}}>{n.body}</div>
          <form action={`/api/notifications/${n.id}/read`} method="post" style={{marginTop:6}}>
            {!n.read && <button style={{padding:'6px 10px', border:'1px solid #000'}}>Mark as read</button>}
          </form>
        </div>
      ))}
    </main>
  )
}
