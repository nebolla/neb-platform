"use client"
import { useEffect } from "react"
import { signOut } from "next-auth/react"

export default function Logout(){
  useEffect(()=>{ signOut({ callbackUrl: "/" }) },[])
  return <main style={{padding:"2rem"}}>Signing out…</main>
}
