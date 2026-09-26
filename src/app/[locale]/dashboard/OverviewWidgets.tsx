'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, PieChart, Pie, Cell } from 'recharts'
import { Wallet, Target, TrendingUp, Edit2, Loader2, ArrowRight, ScanLine, Plus, Tag, Receipt, Medal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

type Expense = any

interface Props {
  expenses: Expense[]
  categories: any[]
  monthKey: string // YYYY-MM
  initialBudget: number
  totalSpent: number
  receiptCount: number
  displayMonthName: string
  topCategory: string
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, gradient, iconBg, actionIcon: ActionIcon, onAction
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  gradient: string
  iconBg: string
  actionIcon?: React.ElementType
  onAction?: () => void
}) {
  return (
    <div className={`relative rounded-2xl p-5 overflow-hidden text-white ${gradient}`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-6 -translate-x-4" />

      {ActionIcon && onAction && (
        <button 
          onClick={onAction}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ActionIcon className="w-4 h-4 text-white" />
        </button>
      )}

      <div className="relative z-10">
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

// ─── Needle Gauge ─────────────────────────────────────────────────────────────
function formatK(value: number) {
  if (value >= 1000) return (value / 1000).toFixed(0) + 'K'
  return value.toString()
}

function NeedleGauge({ value, max }: { value: number, max: number }) {
  const percent = max > 0 ? Math.min(value / max, 1) : 0
  const angle = 180 - (percent * 180)
  const angleRad = (angle * Math.PI) / 180
  
  const cx = 100
  const cy = 90
  const r = 80
  const strokeWidth = 14
  
  const endX = cx + r * Math.cos(angleRad)
  const endY = cy - r * Math.sin(angleRad)
  
  const rotation = percent * 180
  const isExceeded = value > max && max > 0
  const fillColor = isExceeded ? '#ef4444' : '#14b8a6'
  
  return (
    <div className="w-full max-w-[240px] mx-auto flex flex-col">
      <svg viewBox="0 0 200 105" className="w-full h-auto overflow-visible">
        {/* Track Arc */}
        <path 
          d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill Arc */}
        {percent > 0 && (
          <path 
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${endX},${endY}`}
            fill="none"
            stroke={fillColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}
        
        {/* Needle */}
        <g transform={`translate(${cx}, ${cy}) rotate(${rotation})`} className="transition-all duration-1000 ease-out">
          <path d="M 0,-4 L -65,0 L 0,4 Z" fill="#0f766e" />
          <circle cx="0" cy="0" r="8" fill="#0f766e" />
        </g>
      </svg>

      {/* Labels */}
      <div className="flex justify-between items-end px-2 mt-1 text-xs font-medium text-slate-400">
        <span className="mb-1">SAR 0</span>
        <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{formatK(value)}</span>
        <span className="mb-1">SAR {formatK(max)}</span>
      </div>
    </div>
  )
}

export function OverviewWidgets({ expenses, categories, monthKey, initialBudget, totalSpent, receiptCount, displayMonthName, topCategory }: Props) {
  const router = useRouter()
  const t = useTranslations('Overview')
  const tNames = useTranslations('CategoryNames')
  
  const getCategoryName = (name: string) => {
    try {
      const defaults = ["Groceries", "Personal Care", "Travel", "Entertainment & Subscriptions", "Other", "Transportation", "Electronics", "Housing & Rent", "Shopping", "Education", "Healthcare", "Restaurants & Cafes", "Utilities & Bills"]
      if (defaults.includes(name)) {
        return tNames(name as any)
      }
      return name
    } catch {
      return name
    }
  }

  const [budget, setBudget] = useState(initialBudget)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState(initialBudget.toString())
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setBudget(initialBudget)
    setBudgetInput(initialBudget.toString())
  }, [initialBudget])

  // 1. Calculate Top Merchants
  const merchantTotals = expenses.reduce((acc, exp) => {
    const name = exp.merchant_name || 'Unknown'
    acc[name] = (acc[name] || 0) + (exp.amount || 0)
    return acc
  }, {} as Record<string, number>)

  const topMerchants = Object.entries(merchantTotals)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 4)

  // 2. Weekly Comparison Data (Last 7 days vs Previous 7 days)
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
  const latestDate = sortedExpenses.length > 0 ? new Date(sortedExpenses[0].transaction_date) : new Date()
  
  const weeklyData = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map((day, index) => {
    return { name: day, thisWeek: 0, lastWeek: 0 }
  })

  expenses.forEach(exp => {
    const d = new Date(exp.transaction_date)
    const diffTime = Math.abs(latestDate.getTime() - d.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 7) {
      weeklyData[d.getDay()].thisWeek += (exp.amount || 0)
    } else if (diffDays < 14) {
      weeklyData[d.getDay()].lastWeek += (exp.amount || 0)
    }
  })

  // 4. Expenses by Category (Donut)
  const categoryTotalsData = expenses.reduce((acc, exp) => {
    const cId = exp.category_id
    let cName  = 'Other'
    let cColor = '#94a3b8'
    if (categories && cId) {
      const match = categories.find(c => c.id === cId)
      if (match) { cName = match.name; cColor = match.color_hex || '#94a3b8' }
    }
    if (!acc[cName]) acc[cName] = { name: cName, value: 0, color: cColor }
    acc[cName].value += (exp.amount || 0)
    return acc
  }, {} as Record<string, { name: string, value: number, color: string }>)

  const donutData = Object.values(categoryTotalsData)
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  // 5. Save Budget Handler
  const handleSaveBudget = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const currentBudgets = user.user_metadata?.budgets || {}
        const numVal = parseFloat(budgetInput) || 0
        const newBudgets = { ...currentBudgets, [monthKey]: numVal }
        
        await supabase.auth.updateUser({
          data: { budgets: newBudgets }
        })
        setBudget(numVal)
        setIsEditingBudget(false)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    }
    setIsSaving(false)
  }

  const budgetPercent = budget > 0 ? (totalSpent / budget) * 100 : 0

  const handleFocusGoal = () => {
    setIsEditingBudget(true)
    setTimeout(() => {
      document.getElementById('budget-input')?.focus()
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Bank Card Widget (Merged) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-sm flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-white/20 transition-colors duration-500" />
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-white/80 font-medium text-xs mb-1 uppercase tracking-wider">{t('total_spent')}</p>
              <h2 className="text-2xl font-bold tracking-tight">SAR {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="relative z-10 mt-6 flex items-end justify-between">
            <div>
              <p className="text-white/60 text-[10px] mb-0.5">{t('period')}</p>
              <p className="font-semibold tracking-wider text-xs">{monthKey}</p>
            </div>
            <div className="flex gap-1.5">
              <div className="w-6 h-6 rounded-full bg-white/40 mix-blend-screen" />
              <div className="w-6 h-6 rounded-full bg-white/20 mix-blend-screen -ml-3" />
            </div>
          </div>
        </div>

        <StatCard
          label={t('receipts_scanned')}
          value={receiptCount.toString()}
          sub={displayMonthName}
          icon={Receipt}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          iconBg="bg-white/20"
        />
        <StatCard
          label={t('top_category')}
          value={getCategoryName(topCategory)}
          sub={t('highest_spending')}
          icon={Tag}
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          iconBg="bg-white/20"
        />
        <StatCard
          label={budget > 0 && totalSpent > budget ? t('budget_exceeded') : t('budget_remaining')}
          value={budget > 0 ? `SAR ${Math.abs(budget - totalSpent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : t('not_set')}
          sub={budget > 0 ? `SAR ${budget.toLocaleString()}` : t('click_to_set')}
          icon={Wallet}
          gradient={budget > 0 && totalSpent > budget ? "bg-gradient-to-br from-red-500 to-rose-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"}
          iconBg="bg-white/20"
          actionIcon={budget > 0 ? Edit2 : Plus}
          onAction={handleFocusGoal}
        />
      </div>

      {/* Top Row: Luxury Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Budget Gauge Chart */}
        <div className="bg-white dark:bg-slate-900 dark:bg-gradient-to-br dark:from-blue-500/10 dark:to-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-blue-500/20 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-blue-500/10 transition-colors duration-500" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                {t('monthly_goal')}
              </h3>
              <p className="text-xs text-slate-500 font-medium ml-7 mt-0.5">{t('target_vs_achievement')}</p>
            </div>
            <button 
              onClick={() => setIsEditingBudget(!isEditingBudget)}
              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          {isEditingBudget ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 relative z-10">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 text-center">{t('set_limit')} {monthKey}</p>
              <div className="flex w-full gap-2">
                <input 
                  id="budget-input"
                  type="number" 
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-100"
                  placeholder="e.g. 5000"
                />
                <button 
                  onClick={handleSaveBudget}
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center min-w-[80px]"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
                </button>
              </div>
            </div>
          ) : budget > 0 ? (
            <div className="flex-1 flex flex-wrap items-center justify-between gap-6 relative z-10 mt-4">
              {/* LEFT SIDE: Stats */}
              <div className="flex-1 min-w-[140px] space-y-6">
                 <div className="flex items-start gap-3">
                    <Medal className="w-6 h-6 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-0.5">{t('target_achieved')}</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">SAR {totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-3">
                    <Target className="w-6 h-6 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-0.5">{t('this_month_target')}</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">SAR {budget.toLocaleString()}</p>
                    </div>
                 </div>
              </div>

              {/* RIGHT SIDE: Gauge */}
              <div className="flex-1 min-w-[200px] flex justify-center">
                 <NeedleGauge value={totalSpent} max={budget} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                <Target className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">{t('no_budget')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('set_limit_desc')}</p>
            </div>
          )}
        </div>

        {/* Expenses by Category (Donut Chart) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-500" />
              {t('expenses_by_category')}
            </h3>
          </div>
          {donutData.length > 0 ? (
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center relative">
              <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`SAR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Amount']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 mt-4 md:mt-0 md:ml-6 flex-1 w-full overflow-y-auto max-h-[140px] pr-2 custom-scrollbar">
                {donutData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[90px]" title={getCategoryName(entry.name)}>{getCategoryName(entry.name)}</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{((entry.value / totalSpent) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                <Tag className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">{t('no_categories')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('add_expenses_desc')}</p>
            </div>
          )}
        </div>

        {/* Top Merchants */}
        <div className="bg-white dark:bg-slate-900 dark:bg-gradient-to-br dark:from-rose-500/10 dark:to-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-rose-500/20 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-rose-500/10 transition-colors duration-500" />
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('top_merchants')}</h3>
          </div>
          {topMerchants.length > 0 ? (
            <div className="flex flex-col gap-4 flex-1 justify-center relative z-10">
              {topMerchants.map(([name, amount], i) => (
                <div key={name} className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs border border-slate-200 dark:border-slate-700">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{((amount as number / totalSpent) * 100).toFixed(0)}% {t('of_total')}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover/item:text-rose-500 transition-colors">
                    SAR {(amount as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm relative z-10">
              {t('no_transactions')}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Row: Weekly Comparison & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                {t('weekly_comparison')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('last_7_days')}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <div className="w-3 h-3 rounded bg-emerald-500" /> {t('this_week')}
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" /> {t('last_week')}
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`SAR ${value.toFixed(2)}`, '']}
                />
                <Bar dataKey="lastWeek" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="thisWeek" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 flex flex-col justify-center">
          <p className="text-sm font-semibold text-slate-500 px-1 mb-1">{t('quick_actions')}</p>
          <QuickAction href="/dashboard/scanner" icon={ScanLine} label={t('scan_receipt')} description={t('scan_desc')} color="bg-emerald-500" />
          <QuickAction href="/dashboard/expenses" icon={Plus} label={t('add_expense')} description={t('add_desc')} color="bg-violet-500" />
          <QuickAction href="/dashboard/categories" icon={Tag} label={t('manage_categories')} description={t('manage_desc')} color="bg-amber-500" />
        </div>
      </div>

    </div>
  )
}

function QuickAction({
  href, icon: Icon, label, description, color,
}: {
  href: string; icon: React.ElementType
  label: string; description: string; color: string
}) {
  return (
    <Link href={href}>
      <div className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  )
}
