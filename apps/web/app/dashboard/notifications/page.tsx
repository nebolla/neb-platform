'use client'
import { useEffect, useState } from 'react'

export default function NotificationsPage(){
  const [items, setItems] = useState<any[]>([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try{
      const r = await fetch('/api/notifications', { cache: 'no-store' })
      const j = await r.json()
      if(!j.ok) setErr(j.error || 'Error')
      else setItems(j.items || [])
    }catch(e:any){ setErr(e?.message || 'Error') }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const markRead = async (id: string) => {
    try{
      const r = await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      const j = await r.json()
      if(j.ok) setItems(list => list.map(x => x.id === id ? ({ ...x, read: true }) : x))
    }catch{}
  }

  return (
    <main style={{padding:'2rem'}}>
      <h2>Notifications</h2>
      {err && <p style={{color:'crimson'}}>{err}</p>}
      {loading && <p>Loading…</p>}
      {!loading && items.length===0 && <p>No notifications.</p>}

      {items.map(n => (
        <div key={n.id} style={{border:'1px solid #eee', padding:12, margin:'10px 0', background:n.read?'#fafafa':'#fff'}}>
          <div style={{fontWeight:700}}>{n.title}</div>
          <div style={{fontSize:14, color:'#444', whiteSpace:'pre-wrap'}}>{n.body}</div>
          {!n.read && (
            <button onClick={()=>markRead(n.id)} style={{marginTop:6, padding:'6px 10px', border:'1px solid #000'}}>
              Mark as read
            </button>
          )}
        </div>
      ))}
    </main>
  )
}
