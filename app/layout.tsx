import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Promptpad',
  description: 'Local-first prompt drafting tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}