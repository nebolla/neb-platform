export default function Home() {
  return (
    <main style={{padding: '2rem', fontFamily: 'ui-sans-serif'}}>
      <h1 style={{fontSize:'2rem', marginBottom:'0.5rem'}}>Nebolla NEB — Dev</h1>
      <p>Server OK. Try <a href="/api/health" style={{textDecoration:'underline'}}>API Health</a>.</p>
    </main>
  )
}
