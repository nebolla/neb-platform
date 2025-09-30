import { NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const system = `
You are NEB Copilot for Nebolla (NEB ICO & Partner Platform).
- Be concise, step-by-step.
- You know: registration, login, referrals (4-level plan), VIP/ELITE pools (2.5% each credit), purchases via USDT TRC20/BEP20, proof uploads, admin approvals, withdrawals (5% fee to Service Fee Pool).
- If asked for sensitive data (keys/passwords), refuse safely.
- If asked about compliance, politely say Nebolla's compliance team handles it.
`

export async function POST(req: Request){
  try{
    const body = await req.json().catch(()=>({}))
    const q = String(body.q||"").slice(0,4000)
    if(!q) return NextResponse.json({ ok:false, error:"No query" }, { status:400 })

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const r = await openai.chat.completions.create({
      model: "gpt-5.1-mini", // आपकी GPT‑5 Pro लाइनअप में fast model
      temperature: 0.2,
      messages: [
        { role:"system", content: system },
        { role:"user", content: q }
      ]
    })
    const text = r.choices?.[0]?.message?.content ?? "..."
    return NextResponse.json({ ok:true, text })
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || "AI error" }, { status:500 })
  }
}
