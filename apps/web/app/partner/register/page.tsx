"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function RegisterPage(){
  const params = useSearchParams(); const router = useRouter()
  const [name,setName]=useState("")
  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const [phone,setPhone]=useState("")
  const [addressLine1,setA1]=useState("")
  const [addressLine2,setA2]=useState("")
  const [city,setCity]=useState("")
  const [state,setState]=useState("")
  const [postalCode,setZip]=useState("")
  const [country,setCountry]=useState("")
  const [dateOfBirth,setDob]=useState("")
  const [referralCode,setRef]=useState("")
  const [msg,setMsg]=useState<string|null>(null)

  useEffect(()=>{ const r=params.get("ref"); if(r) setRef(r.toUpperCase()) },[params])

  async function submit(e:React.FormEvent){
    e.preventDefault(); setMsg("Creating account…")
    const res = await fetch("/api/auth/register", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        name, email, password, referralCode,
        phone, addressLine1, addressLine2, city, state, postalCode, country,
        dateOfBirth
      })
    })
    const j = await res.json()
    if(!res.ok){ setMsg(j.error||"Error"); return }
    setMsg("Registered! Redirecting to login…")
    setTimeout(()=>router.push("/partner/login"), 900)
  }

  const FI = (p:any)=><input {...p} style={{display:"block", width:"100%", padding:8, margin:"6px 0 12px"}} />

  return (
    <main style={{maxWidth:560, margin:"3rem auto", fontFamily:"ui-sans-serif"}}>
      <h1 style={{fontSize:28, marginBottom:12}}>Become a Partner</h1>
      <form onSubmit={submit}>
        <label>Full Name</label><FI value={name} onChange={(e:any)=>setName(e.target.value)} required />
        <label>Email Address</label><FI type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} required />
        <label>Password</label><FI type="password" value={password} onChange={(e:any)=>setPassword(e.target.value)} required />
        <label>Mobile Number</label><FI value={phone} onChange={(e:any)=>setPhone(e.target.value)} required />
        <label>Address Line 1</label><FI value={addressLine1} onChange={(e:any)=>setA1(e.target.value)} required />
        <label>Address Line 2 (optional)</label><FI value={addressLine2} onChange={(e:any)=>setA2(e.target.value)} />
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div><label>City</label><FI value={city} onChange={(e:any)=>setCity(e.target.value)} required /></div>
          <div><label>State/Province</label><FI value={state} onChange={(e:any)=>setState(e.target.value)} required /></div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div><label>ZIP/Postal Code</label><FI value={postalCode} onChange={(e:any)=>setZip(e.target.value)} required /></div>
          <div><label>Country</label><FI value={country} onChange={(e:any)=>setCountry(e.target.value)} required /></div>
        </div>
        <label>Date of Birth</label><FI type="date" value={dateOfBirth} onChange={(e:any)=>setDob(e.target.value)} required />
        <label>Referral Code (optional)</label><FI value={referralCode} onChange={(e:any)=>setRef(e.target.value)} />
        <button type="submit" style={{padding:"10px 14px", border:"1px solid #000"}}>Register</button>
      </form>
      <p style={{marginTop:12, color:"#b00"}}>{msg}</p>
      <p style={{marginTop:24}}>Already a Partner? <a href="/partner/login">Login</a></p>
    </main>
  )
}
