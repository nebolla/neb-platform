import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nebolla NEB — Dev',
  description: 'AI-native Partner Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
