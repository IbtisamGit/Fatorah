import {
  TrendingDown, Receipt, Tag, Wallet,
  ArrowUpRight, ScanLine, Plus, ArrowRight
} from 'lucide-react'
import { Link } from '@/i18n/routing'

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, gradient, iconBg,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  gradient: string
  iconBg: string
}) {
  return (
    <div className={`relative rounded-2xl p-5 overflow-hidden text-white ${gradient}`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-6 -translate-x-4" />

      <div className="relative">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm font-medium text-white/75 mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-white/60 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({
  href, icon: Icon, label, description, color,
}: {
  href: string; icon: React.ElementType
  label: string; description: string; color: string
}) {
  return (
    <Link href={href}>
      <div className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800
                      hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  )
}

import { createClient } from '@/utils/supabase/server'
import { OverviewCharts } from './OverviewCharts'

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function OverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let totalSpent = 0
  let receiptCount = 0
  let topCategory = '—'
  let monthlyBudget = 0
  
  const chartData = {
    monthlyData: [] as { month: string, amount: number }[],
    categoryData: [] as { name: string, value: number, color: string }[]
  }

  if (user) {
    // Fetch User Profile for Budget
    const { data: profile } = await supabase
      .from('users')
      .select('monthly_budget_limit')
      .eq('id', user.id)
      .single()
      
    if (profile?.monthly_budget_limit) {
      monthlyBudget = profile.monthly_budget_limit
    }

    // Fetch Expenses and Categories
    const [{ data: expenses }, { data: categories }] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('categories').select('*')
    ])
      
    if (expenses && expenses.length > 0) {
      totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      receiptCount = expenses.length
      
      const catsData = expenses.reduce((acc, exp) => {
        // Map category_id back to name
        const cId = exp.category_id
        let cName = 'Other'
        let cColor = '#94a3b8'
        
        if (categories && cId) {
          const match = categories.find(c => c.id === cId)
          if (match) {
            cName = match.name
            cColor = match.color_hex
          }
        }
        
        if (!acc[cName]) acc[cName] = { amount: 0, color: cColor }
        acc[cName].amount += (exp.amount || 0)
        return acc
      }, {} as Record<string, { amount: number, color: string }>)
      
      // Top category by amount
      const sortedCats = Object.keys(catsData).sort((a, b) => catsData[b].amount - catsData[a].amount)
      topCategory = sortedCats[0] || '—'

      // Prepare Category Data for Pie Chart
      chartData.categoryData = sortedCats.map(cName => ({
        name: cName,
        value: catsData[cName].amount,
        color: catsData[cName].color
      }))

      // Prepare Monthly Data for Bar Chart (last 6 months logic)
      const monthsAcc = expenses.reduce((acc, exp) => {
        const date = new Date(exp.transaction_date || exp.created_at)
        const monthKey = date.toLocaleString('en-US', { month: 'short' })
        acc[monthKey] = (acc[monthKey] || 0) + (exp.amount || 0)
        return acc
      }, {} as Record<string, number>)

      // Ensure chronological order could be done properly, but for now we just use the keys present
      chartData.monthlyData = Object.keys(monthsAcc).map(m => ({ month: m, amount: monthsAcc[m] }))
    }
  }

  const budgetPercent   = monthlyBudget > 0 ? Math.min((totalSpent / monthlyBudget) * 100, 100) : 0
  const remaining       = monthlyBudget - totalSpent
  const hasData         = totalSpent > 0
  const now             = new Date()
  const monthName       = now.toLocaleString('en', { month: 'long' })
  const year            = now.getFullYear()

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{monthName} {year}</p>
        </div>
        <Link href="/dashboard/scanner">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600
                             text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/25
                             transition-all hover:-translate-y-0.5">
            <ScanLine className="w-4 h-4" />
            Scan Receipt
          </button>
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Spent"
          value={`SAR ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`This month`}
          icon={TrendingDown}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          iconBg="bg-white/20"
        />
        <StatCard
          label="Receipts Scanned"
          value={receiptCount.toString()}
          sub="This month"
          icon={Receipt}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          iconBg="bg-white/20"
        />
        <StatCard
          label="Top Category"
          value={topCategory}
          sub="Highest spending"
          icon={Tag}
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          iconBg="bg-white/20"
        />
        <StatCard
          label="Budget Remaining"
          value={monthlyBudget > 0 ? `SAR ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Not set'}
          sub={monthlyBudget > 0 ? `of SAR ${monthlyBudget.toLocaleString()}` : 'Set in Settings'}
          icon={Wallet}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          iconBg="bg-white/20"
        />
      </div>

      {/* ── Budget Progress ── */}
      {monthlyBudget > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Monthly Budget</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                SAR {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent of SAR {monthlyBudget.toLocaleString()}
              </p>
            </div>
            <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
              budgetPercent >= 90 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
              budgetPercent >= 75 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
              'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}>
              {budgetPercent.toFixed(0)}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                budgetPercent >= 90 ? 'bg-red-500' :
                budgetPercent >= 75 ? 'bg-amber-400' :
                'bg-emerald-500'
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Empty State OR Content ── */}
      {!hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Empty state card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10
                          flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <Receipt className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No expenses yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Add your first expense manually or scan a receipt
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/scanner">
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600
                                   text-white text-sm font-semibold rounded-xl transition-all">
                  <ScanLine className="w-4 h-4" /> Scan Receipt
                </button>
              </Link>
              <Link href="/dashboard/expenses">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700
                                   text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-all">
                  <Plus className="w-4 h-4" /> Add Manually
                </button>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-500 px-1">Quick Actions</p>
            <QuickAction href="/dashboard/scanner" icon={ScanLine} label="Scan a Receipt" description="Upload a photo and let AI extract the data" color="bg-emerald-500" />
            <QuickAction href="/dashboard/expenses" icon={Plus} label="Add Expense" description="Enter expense details manually" color="bg-violet-500" />
            <QuickAction href="/dashboard/settings" icon={Wallet} label="Set Monthly Budget" description="Define your spending limit" color="bg-blue-500" />
            <QuickAction href="/dashboard/categories" icon={Tag} label="Manage Categories" description="Customize your expense categories" color="bg-amber-500" />
          </div>
        </div>
      ) : (
        <OverviewCharts data={chartData} />
      )}

    </div>
  )
}
