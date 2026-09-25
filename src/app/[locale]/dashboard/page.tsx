import {
  TrendingDown, Receipt, Tag, Wallet,
  ArrowUpRight, ScanLine, Plus, ArrowRight
} from 'lucide-react'
import { Link } from '@/i18n/routing'

// ─── Stat Card removed and moved to OverviewWidgets ───

import { createClient } from '@/utils/supabase/server'
import { OverviewWidgets } from './OverviewWidgets'
import { OverviewFilters } from './OverviewFilters'
import { Suspense } from 'react'
import { CalendarDays } from 'lucide-react'

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // searchParams is a Promise in this Next.js version — must await it
  const resolvedParams = await searchParams

  // Resolve year/month from URL params or default to current month
  const now = new Date()
  const selectedYear  = resolvedParams.year  ? parseInt(resolvedParams.year)  : now.getFullYear()
  const selectedMonth = resolvedParams.month ? parseInt(resolvedParams.month) : now.getMonth() + 1

  // Clamp: don't allow future months
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1
  const isFuture = selectedYear > now.getFullYear() || 
                   (selectedYear === now.getFullYear() && selectedMonth > now.getMonth() + 1)

  let totalSpent = 0
  let receiptCount = 0
  let topCategory = '—'
  let monthlyBudget = 0
  
  const chartData = {
    monthlyData: [] as { month: string, amount: number }[],
    categoryData: [] as { name: string, value: number, color: string }[]
  }

  // Compute selected month date range
  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`

  let expenses: any[] = []
  let categories: any[] = []

  if (user && !isFuture) {
    const currentBudgets = user.user_metadata?.budgets || {}
    monthlyBudget = currentBudgets[monthKey] || 0

    // Compute selected month date range
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1).toISOString()
    const monthEnd   = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).toISOString()

    // Fetch Expenses and Categories for selected month
    const [expensesRes, categoriesRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id)
        .gte('transaction_date', monthStart)
        .lte('transaction_date', monthEnd),
      supabase.from('categories').select('*')
    ])
    
    expenses = expensesRes.data || []
    categories = categoriesRes.data || []
      
    if (expenses && expenses.length > 0) {
      totalSpent   = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      receiptCount = expenses.length
      
      const catsData = expenses.reduce((acc, exp) => {
        const cId = exp.category_id
        let cName  = 'Other'
        let cColor = '#94a3b8'
        if (categories && cId) {
          const match = categories.find(c => c.id === cId)
          if (match) { cName = match.name; cColor = match.color_hex }
        }
        if (!acc[cName]) acc[cName] = { amount: 0, color: cColor }
        acc[cName].amount += (exp.amount || 0)
        return acc
      }, {} as Record<string, { amount: number, color: string }>)
      
      const sortedCats = Object.keys(catsData).sort((a, b) => catsData[b].amount - catsData[a].amount)
      topCategory = sortedCats[0] || '—'

      chartData.categoryData = sortedCats.map(cName => ({
        name: cName,
        value: catsData[cName].amount,
        color: catsData[cName].color
      }))

      const monthsAcc = expenses.reduce((acc, exp) => {
        const date     = new Date(exp.transaction_date || exp.created_at)
        const monthKey = date.toLocaleString('en-US', { month: 'short' })
        acc[monthKey]  = (acc[monthKey] || 0) + (exp.amount || 0)
        return acc
      }, {} as Record<string, number>)

      chartData.monthlyData = Object.keys(monthsAcc).map(m => ({ month: m, amount: monthsAcc[m] }))
    }
  }

  const budgetPercent = monthlyBudget > 0 ? Math.min((totalSpent / monthlyBudget) * 100, 100) : 0
  const remaining     = monthlyBudget - totalSpent
  const hasData       = totalSpent > 0

  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December']
  const displayMonthName = MONTH_NAMES[selectedMonth - 1]

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {displayMonthName} {selectedYear}
            {isCurrentMonth && <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">Current</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm w-[170px] h-9 animate-pulse">
              <CalendarDays className="w-4 h-4 text-slate-300" />
            </div>
          }>
            <OverviewFilters year={selectedYear} month={selectedMonth} />
          </Suspense>
          <Link href="/dashboard/scanner">
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5">
              <ScanLine className="w-4 h-4" />
              Scan Receipt
            </button>
          </Link>
        </div>
      </div>

      {/* ── Main Content Widgets ── */}
      <OverviewWidgets 
        expenses={expenses || []} 
        categories={categories || []}
        monthKey={monthKey}
        initialBudget={monthlyBudget}
        totalSpent={totalSpent}
        receiptCount={receiptCount}
        displayMonthName={displayMonthName}
        topCategory={topCategory}
      />

    </div>
  )
}
