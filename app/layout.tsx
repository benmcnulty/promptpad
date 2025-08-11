import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ModelProvider } from '@/components/ModelProvider'

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
    <html lang="en" suppressHydrationWarning data-accent="emerald">
      <body className="antialiased">
        <ThemeProvider>
          <ModelProvider>
            {children}
          </ModelProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
