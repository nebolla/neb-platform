export const dynamic = "force-dynamic"

export default function RegisterPage(){
  return (
    <main style={{padding:"2rem", fontFamily:"ui-sans-serif"}}>
      <h1>Become a Partner</h1>

      <form action="/api/partner/register" method="post" style={{maxWidth:560}}>
        <label>Name</label>
        <input name="name" required style={{display:"block",padding:8,margin:"6px 0 12px",width:"100%"}} />

        <label>Email</label>
        <input type="email" name="email" required style={{display:"block",padding:8,margin:"6px 0 12px",width:"100%"}} />

        <label>Mobile</label>
        <input name="phone" required style={{display:"block",padding:8,margin:"6px 0 12px",width:"100%"}} />

        <label>Password</label>
        <input type="password" name="password" required style={{display:"block",padding:8,margin:"6px 0 12px",width:"100%"}} />

        <label>Address Line 1</label>
        <input name="address1" required style={{display:"block",padding:8,margin:"6px 0 12px",width:"100%"}} />
        <label>Address Line 2 (optional)</label>
        <input name="address2" style={{display:"block",padding:8,margin:"6px 0 12px",width:"100%"}} />

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <label>City</label>
            <input name="city" required style={{display:"block",padding:8,marginTop:6,width:"100%"}} />
          </div>
          <div>
            <label>State/Province</label>
            <input name="state" required style={{display:"block",padding:8,marginTop:6,width:"100%"}} />
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12, marginTop:12}}>
          <div>
            <label>ZIP/Postal Code</label>
            <input name="zip" required style={{display:"block",padding:8,marginTop:6,width:"100%"}} />
          </div>
          <div>
            <label>Country</label>
            <input name="country" required style={{display:"block",padding:8,marginTop:6,width:"100%"}} />
          </div>
        </div>

        <label style={{marginTop:12,display:'block'}}>Date of Birth</label>
        <input type="date" name="dob" required style={{display:"block",padding:8,margin:"6px 0 12px"}} />

        <label>Referral Code (optional)</label>
        <input name="referralCode" style={{display:"block",padding:8,margin:"6px 0 12px"}} />

        <button style={{padding:"8px 12px", border:"1px solid #000"}}>Register</button>
      </form>

      <p style={{marginTop:12}}>Already a Partner? <a href="/partner/login">Login</a></p>
    </main>
  )
}
