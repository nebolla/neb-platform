'use client'
import { useState } from 'react'

export default function PoolsAdmin(){
  const [preview, setPreview] = useState<any>(null)
  const [msg, setMsg] = useState('')

  const doPreview = async ()=>{
    setMsg(''); setPreview(null)
    const r = await fetch('/api/admin/pools/preview', { cache:'no-store' })
    const j = await r.json(); if(!j.ok){ setMsg(j.error||'Error'); return }
    setPreview(j)
  }
  const distribute = async (pool:'VIP'|'ELITE')=>{
    setMsg('Processing…')
    const r = await fetch('/api/admin/pools/distribute', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ pool }) })
    const j = await r.json(); setMsg(j.ok ? `Done: ${j.pool} → members ${j.members}, share $${j.share}` : (j.error||'Error'))
  }

  return (
    <main style={{padding:'2rem', fontFamily:"ui-sans-serif"}}>
      <h1>Pools — VIP/ELITE</h1>
      <button onClick={doPreview} style={{padding:'8px 12px', border:'1px solid #000'}}>Preview</button>
      {msg && <p style={{marginTop:8}}>{msg}</p>}
      {preview && (
        <pre style={{background:'#fafafa', padding:12, marginTop:12}}>{JSON.stringify(preview,null,2)}</pre>
      )}
      <div style={{display:'flex', gap:12, marginTop:12}}>
        <button onClick={()=>distribute('VIP')} style={{padding:'8px 12px', border:'1px solid #000'}}>Distribute VIP</button>
        <button onClick={()=>distribute('ELITE')} style={{padding:'8px 12px', border:'1px solid #000'}}>Distribute ELITE</button>
      </div>
    </main>
  )
}
