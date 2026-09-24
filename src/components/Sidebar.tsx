'use client'

import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard, Receipt, ScanLine, PieChart,
  FolderHeart, Settings, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import clsx from 'clsx'

function useNavLinks() {
  const t = useTranslations('Sidebar')
  return [
    { href: '/dashboard',            label: t('overview'),    icon: LayoutDashboard, exact: true },
    { href: '/dashboard/expenses',   label: t('expenses'),    icon: Receipt },
    { href: '/dashboard/scanner',    label: t('scanner'),     icon: ScanLine },
    { href: '/dashboard/analytics',  label: t('analytics'),   icon: PieChart },
    { href: '/dashboard/categories', label: t('categories'),  icon: FolderHeart },
    { href: '/dashboard/settings',   label: t('settings'),    icon: Settings },
  ]
}

function NavItem({
  href, label, icon: Icon, exact, isCollapsed, onClick,
}: {
  href: string; label: string; icon: React.ElementType
  exact?: boolean; isCollapsed: boolean; onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        'relative flex items-center rounded-xl transition-all duration-200 group',
        isCollapsed ? 'justify-center p-3 mx-1' : 'gap-3 px-3 py-2.5',
        isActive
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
      )}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />

      {!isCollapsed && (
        <span className="text-sm font-medium">{label}</span>
      )}

      {/* Tooltip on collapsed */}
      {isCollapsed && (
        <span className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-800 text-white text-xs
                         font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none
                         whitespace-nowrap transition-opacity duration-150 z-[60] shadow-xl">
          {label}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
        </span>
      )}
    </Link>
  )
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
export function Sidebar({
  isCollapsed, onToggle, mobileOpen, onMobileClose,
}: {
  isCollapsed: boolean; onToggle: () => void
  mobileOpen: boolean; onMobileClose: () => void
}) {
  const links = useNavLinks()

  return (
    <>
      {/* ── Desktop ── */}
      <aside
        className={clsx(
          'relative hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 h-full shrink-0',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-[68px]' : 'w-[230px]'
        )}
      >
        {/* ── Floating toggle tab on the right edge ── */}
        <button
          onClick={onToggle}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-[72px] z-50
                     w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                     flex items-center justify-center shadow-md
                     hover:bg-emerald-50 dark:hover:bg-slate-700 hover:border-emerald-300 dark:hover:border-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400
                     text-slate-400 dark:text-slate-500 transition-all duration-200"
        >
          {isCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft  className="w-3.5 h-3.5" />}
        </button>

        {/* Logo */}
        <div className={clsx(
          'flex items-center h-16 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-hidden',
          isCollapsed ? 'justify-center px-3' : 'px-5 gap-2.5'
        )}>
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
            <Receipt className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-[15px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">Fatorah</span>
          )}
        </div>

        {/* Nav */}
        <nav className={clsx(
          'flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-0.5',
          isCollapsed ? 'px-1' : 'px-3'
        )}>
          {links.map(link => (
            <NavItem key={link.href} {...link} isCollapsed={isCollapsed} />
          ))}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="px-5 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} Fatorah</p>
          </div>
        )}
      </aside>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col md:hidden">
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <span className="text-[15px] font-bold text-slate-800 tracking-tight">Fatorah</span>
              </div>
              <button
                onClick={onMobileClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {links.map(link => (
                <NavItem key={link.href} {...link} isCollapsed={false} onClick={onMobileClose} />
              ))}
            </nav>
          </aside>
        </>
      )}
    </>
  )
}
