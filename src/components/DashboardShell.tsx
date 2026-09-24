'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

interface DashboardShellProps {
  children: ReactNode
  userEmail?: string
  locale: string
}

export function DashboardShell({ children, userEmail, locale }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Restore collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fatorah-sidebar-collapsed')
    if (saved !== null) setIsCollapsed(saved === 'true')
  }, [])

  const handleToggle = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('fatorah-sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar
          userEmail={userEmail}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
