"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAVIGATION_ITEMS = [
  {
    id: 'prompt-enhancer',
    label: 'Prompt Enhancer',
    href: '/prompt-enhancer',
    description: 'Refine, reinforce, and spec generation'
  },
  {
    id: 'agent-editor',
    label: 'Agent Editor',
    href: '/agent-editor',
    description: 'Multi-agent workflow designer'
  },
  {
    id: 'dimensional-visualizer', 
    label: 'Dimensional Visualizer',
    href: '/dimensional-visualizer',
    description: 'Coming soon - Data visualization tool'
  }
]

export default function AppHeader() {
  const pathname = usePathname()
  
  const getCurrentPageInfo = () => {
    // Handle null pathname (testing scenario) or root path
    if (!pathname || pathname === '/') {
      return NAVIGATION_ITEMS[0] // Default to prompt enhancer
    }
    
    const currentItem = NAVIGATION_ITEMS.find(item => pathname.startsWith(item.href))
    return currentItem || NAVIGATION_ITEMS[0]
  }

  const currentPage = getCurrentPageInfo()

  return (
    <header className="glass border-b border-white/20 px-6 py-4 backdrop-blur-md flex-shrink-0" role="banner">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and current page */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <h1 className="text-3xl font-bold text-gradient group-hover:scale-105 transition-transform duration-200">
              Promptpad
            </h1>
          </Link>
          
          {/* Page indicator */}
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-slate-400">•</span>
            <div className="text-sm">
              <div className="font-semibold text-slate-700 text-emboss-subtle">{currentPage.label}</div>
              <div className="text-xs text-slate-500 text-emboss-subtle">{currentPage.description}</div>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center space-x-1" role="navigation">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = !pathname || pathname === '/' 
              ? item.id === 'prompt-enhancer' 
              : pathname.startsWith(item.href)
            const isComingSoon = item.id === 'dimensional-visualizer'
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  isActive
                    ? 'bg-white/90 text-slate-900 shadow-lg border border-white/60 backdrop-blur-sm'
                    : isComingSoon
                    ? 'bg-white/50 text-slate-700 hover:bg-white/70 hover:text-slate-900 border border-white/30 shadow-soft backdrop-blur-sm'
                    : 'bg-white/50 text-slate-700 hover:bg-white/70 hover:text-slate-900 border border-white/30 shadow-soft backdrop-blur-sm'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{item.label}</span>
                {isComingSoon && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                    Soon
                  </span>
                )}
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 animate-pulse shadow-lg" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}