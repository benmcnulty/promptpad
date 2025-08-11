import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ModelProvider } from '@/components/ModelProvider'
import { DebugProvider } from '@/components/DebugProvider'
import { WelcomeProvider } from '@/components/WelcomeProvider'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'

export const metadata: Metadata = {
  title: 'Promptpad',
  description: 'Local-first prompt drafting and visualization platform',
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
            <DebugProvider>
              <WelcomeProvider>
                {/* Changed h-screen to min-h-screen to allow pages taller than viewport to scroll */}
                <div className="min-h-screen flex flex-col">
                  <AppHeader />
                  <main className="flex-1 min-h-0">
                    {children}
                  </main>
                  <AppFooter />
                </div>
              </WelcomeProvider>
            </DebugProvider>
          </ModelProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
