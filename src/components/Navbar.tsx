'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from '@/i18n/routing'
import { Button } from './ui/button'
import { LogOut, Menu } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

// Map route segments → bilingual page labels
const PAGE_LABELS: Record<string, { ar: string; en: string }> = {
  dashboard:  { ar: 'نظرة عامة',     en: 'Overview' },
  expenses:   { ar: 'سجل المصروفات', en: 'Expenses' },
  scanner:    { ar: 'الماسح الضوئي', en: 'Scanner' },
  analytics:  { ar: 'التقارير',      en: 'Analytics' },
  categories: { ar: 'التصنيفات',     en: 'Categories' },
  settings:   { ar: 'الإعدادات',     en: 'Settings' },
}

interface NavbarProps {
  userEmail?: string
  onMobileMenuOpen: () => void
}

export function Navbar({ userEmail, onMobileMenuOpen }: NavbarProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const t        = useTranslations('Sidebar')
  const locale   = useLocale()
  const isAr     = locale === 'ar'

  // Derive page title from the last route segment
  const segments  = pathname.split('/').filter(Boolean)
  const lastSeg   = segments[segments.length - 1] ?? 'dashboard'
  const pageLabel = PAGE_LABELS[lastSeg]?.[isAr ? 'ar' : 'en'] ?? lastSeg

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Avatar initials from email
  const initials = userEmail?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left: Mobile menu + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base font-semibold text-slate-700">{pageLabel}</h1>
      </div>

      {/* Right: User avatar + email + logout */}
      <div className="flex items-center gap-2">
        {/* Avatar circle */}
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-emerald-700">{initials}</span>
        </div>

        {/* Email — hidden on small screens */}
        {userEmail && (
          <span className="text-sm text-slate-500 hidden sm:inline-block max-w-[180px] truncate">
            {userEmail}
          </span>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-500 hover:text-red-500 hover:bg-red-50 gap-1.5 h-9 px-3 rounded-xl"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">{t('logout')}</span>
        </Button>
      </div>
    </header>
  )
}
