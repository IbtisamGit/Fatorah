'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, CalendarDays, ChevronDown } from 'lucide-react'
import { useTransition, useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  year: number
  month: number // 1-based
}

// Build a list of available years (5 years back up to current)
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i)

export function OverviewFilters({ year, month }: Props) {
  const t = useTranslations('Overview')
  const tMonths = useTranslations('Months')
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Dropdown picker state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear]   = useState(year)
  const [pickerMonth, setPickerMonth] = useState(month)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keep picker state in sync with props when navigating with arrows
  useEffect(() => {
    setPickerYear(year)
    setPickerMonth(month)
  }, [year, month])

  const navigate = (newYear: number, newMonth: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year',  newYear.toString())
    params.set('month', newMonth.toString())
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const goBack = () => {
    if (month === 1) navigate(year - 1, 12)
    else navigate(year, month - 1)
  }

  const goForward = () => {
    if (isCurrentMonth) return
    if (month === 12) navigate(year + 1, 1)
    else navigate(year, month + 1)
  }

  const applyPicker = () => {
    setPickerOpen(false)
    navigate(pickerYear, pickerMonth)
  }

  const goToToday = () => {
    const now = new Date()
    navigate(now.getFullYear(), now.getMonth() + 1)
  }

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  return (
    <div className={`flex items-center gap-2 transition-opacity duration-200 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>

      {/* ◀ Previous Month */}
      <button
        onClick={goBack}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm"
        title="Previous month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Month/Year Display + Dropdown Picker */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setPickerOpen(prev => !prev)}
          className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm min-w-[170px] justify-between hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
          title="Click to pick a specific month"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {tMonths(String(month))} {year}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isPending ? (
              <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${pickerOpen ? 'rotate-180' : ''}`} />
            )}
          </div>
        </button>

        {/* Dropdown Picker Panel */}
        {pickerOpen && (
          <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 w-64 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Year Selector */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{t('year_label')}</label>
              <div className="flex gap-1.5 flex-wrap">
                {YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => setPickerYear(y)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      pickerYear === y
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Month Grid */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{t('month_label')}</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(mNum => {
                  // Disable future months
                  const isFutureMonth = pickerYear > now.getFullYear() ||
                    (pickerYear === now.getFullYear() && mNum > now.getMonth() + 1)
                  return (
                    <button
                      key={mNum}
                      disabled={isFutureMonth}
                      onClick={() => setPickerMonth(mNum)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        pickerMonth === mNum
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tMonths(String(mNum)).slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={applyPicker}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              {t('go_to', { month: tMonths(String(pickerMonth)), year: pickerYear })}
            </button>
          </div>
        )}
      </div>

      {/* ▶ Next Month */}
      <button
        onClick={goForward}
        disabled={isCurrentMonth}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
        title={isCurrentMonth ? "Can't go into the future" : 'Next month'}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Today — only shown when browsing a past month */}
      {!isCurrentMonth && (
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg border border-emerald-200 dark:border-emerald-800/50 transition-colors"
        >
          {t('today')}
        </button>
      )}
    </div>
  )
}
