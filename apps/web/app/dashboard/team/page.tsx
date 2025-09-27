'use client'
import { useEffect, useState } from 'react'
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow'
import 'reactflow/dist/style.css'

export default function TeamPage(){
  const [data,setData] = useState<any>(null)
  const [err,setErr] = useState<string>("")
  useEffect(()=>{ (async()=>{
    try{ const r=await fetch('/api/team'); const j=await r.json(); if(!j.ok) setErr(j.error||"Error"); else setData(j) }catch(e:any){ setErr(e?.message||'Error') }
  })() },[])

  if(err) return <main style={{padding:"2rem"}}><h2>Team</h2><p style={{color:'crimson'}}>{err}</p></main>
  if(!data) return <main style={{padding:"2rem"}}><h2>Team</h2><p>Loading…</p></main>

  const nodes = data.tree.nodes.map((n:any)=>({
    id:n.id, position:{ x:(n.depth||0)*220, y: (n.y||0) }, data:{ label: n.label },
    style:{ padding:8, border:'1px solid #ddd', borderRadius:6, background:'#fff' }
  }))
  // simple vertical stacking by depth
  const byDepth: Record<number, any[]> = {}
  data.tree.nodes.forEach((n:any)=>{ byDepth[n.depth]=byDepth[n.depth]||[]; byDepth[n.depth].push(n) })
  let yGap=80
  Object.entries(byDepth).forEach(([d,arr]:any)=>{
    arr.forEach((n:any,i:number)=>{
      const idx = nodes.findIndex((x:any)=>x.id===n.id)
      nodes[idx].position = { x: Number(d)*220, y: i*yGap }
    })
  })

  const edges = data.tree.edges.map((e:any)=>({ id:e.id, source:e.source, target:e.target }))

  return (
    <main style={{height:'calc(100vh - 20px)', padding:10}}>
      <div style={{marginBottom:10}}>
        <h2 style={{margin:'6px 0'}}>My Team — {data.me.partnerId}</h2>
        <p>Members: <b>{data.totals.members}</b> | Volume: <b>${data.totals.volume}</b> | Estimated Income (L1–L4): <b>${data.totals.income}</b></p>
        <div style={{display:'flex', gap:16, fontSize:14, flexWrap:'wrap'}}>
          {Object.entries(data.levels).map(([L,info]:any)=>(
            <span key={L}>L{L}: members <b>{info.members}</b>, volume <b>${info.volume}</b>, income <b>${info.income}</b></span>
          ))}
        </div>
      </div>
      <div style={{height:'100%', border:'1px solid #eee', borderRadius:6}}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <MiniMap /><Controls /><Background />
        </ReactFlow>
      </div>
    </main>
  )
}
