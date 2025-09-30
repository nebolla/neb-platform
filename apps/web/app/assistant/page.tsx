'use client'
import { useState } from 'react'

export default function Assistant(){
  const [q,setQ]=useState('How do I buy NEB and share my referral link?')
  const [a,setA]=useState(''); const [loading,setLoading]=useState(false)

  const ask=async()=>{
    setLoading(true); setA('')
    const r=await fetch('/api/ai/ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({q})})
    const j=await r.json(); setA(j.ok? j.text : `Error: ${j.error}`); setLoading(false)
  }

  return (
    <main style={{padding:'2rem',maxWidth:720,fontFamily:"ui-sans-serif"}}>
      <h1>NEB Copilot</h1>
      <textarea value={q} onChange={e=>setQ(e.target.value)} rows={4} style={{width:'100%',padding:8}}/>
      <div style={{marginTop:8}}>
        <button onClick={ask} disabled={loading} style={{padding:'8px 12px',border:'1px solid #000'}}>{loading?'Thinking…':'Ask'}</button>
      </div>
      {a && <pre style={{whiteSpace:'pre-wrap',marginTop:12,background:'#fafafa',padding:12}}>{a}</pre>}
    </main>
  )
}
