'use client'

import { useState, useMemo, useEffect } from 'react'
import { useExpenseStore } from '@/store/expenses'
import { createClient } from '@/utils/supabase/client'
import { generateInsights } from '@/app/actions/generateInsights'
import { 
  TrendingUp, Receipt, Activity, Sparkles, BrainCircuit, AlertTriangle, 
  Lightbulb, ActivitySquare, Loader2, ShieldCheck, HeartPulse
} from 'lucide-react'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'

type AIReport = {
  score: number;
  score_message: string;
  behaviors: string[];
  anomalies: string[];
  advice: string[];
}

export function AnalyticsClient() {
  const t = useTranslations('Analytics')
  const { expenses, isLoading, fetchExpenses } = useExpenseStore()
  
  const [budgetsMap, setBudgetsMap] = useState<Record<string, number>>({})
  const [currency, setCurrency] = useState('SAR')
  const [timeFilter, setTimeFilter] = useState<'this_month'|'last_month'|'last_3_months'|'this_year'|'all_time'>('this_month')
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState<AIReport | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  useEffect(() => {
    fetchExpenses()
    fetchUserProfile()
  }, [fetchExpenses])

  const fetchUserProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setBudgetsMap(user.user_metadata?.budgets || {})
      const { data } = await supabase.from('users').select('currency').eq('id', user.id).single()
      if (data) {
        setCurrency(data.currency || 'SAR')
      }
    }
  }

  // Calculate the active budget for the selected period
  const activeBudget = useMemo(() => {
    const now = new Date()
    if (timeFilter === 'this_month') {
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      return budgetsMap[key] || 0
    }
    if (timeFilter === 'last_month') {
      let m = now.getMonth()
      let y = now.getFullYear()
      if (m === 0) { m = 12; y -= 1 }
      const key = `${y}-${String(m).padStart(2, '0')}`
      return budgetsMap[key] || 0
    }
    if (timeFilter === 'this_year') {
      let sum = 0
      for (let i = 1; i <= 12; i++) {
        sum += budgetsMap[`${now.getFullYear()}-${String(i).padStart(2, '0')}`] || 0
      }
      return sum
    }
    return 0 // default for all_time
  }, [timeFilter, budgetsMap])

  // Process data based on time filter
  const filteredExpenses = useMemo(() => {
    const now = new Date()
    return expenses.filter(exp => {
      const expDate = new Date(exp.date)
      switch (timeFilter) {
        case 'this_month':
          return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
        case 'last_month':
          let lastMonth = now.getMonth() - 1
          let year = now.getFullYear()
          if (lastMonth < 0) { lastMonth = 11; year -= 1 }
          return expDate.getMonth() === lastMonth && expDate.getFullYear() === year
        case 'last_3_months':
          const threeMonthsAgo = new Date()
          threeMonthsAgo.setMonth(now.getMonth() - 3)
          return expDate >= threeMonthsAgo
        case 'this_year':
          return expDate.getFullYear() === now.getFullYear()
        case 'all_time':
        default:
          return true
      }
    })
  }, [expenses, timeFilter])

  // Key Metrics
  const totalSpend = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  const transactionCount = filteredExpenses.length
  
  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setErrorMsg(null)
    
    // Prepare lightweight JSON of expenses
    const lightExpenses = filteredExpenses.map(e => ({
      amount: e.amount,
      merchant: e.merchant,
      category: e.category,
      date: e.date.split('T')[0]
    }))
    
    const res = await generateInsights(JSON.stringify(lightExpenses), activeBudget, currency)
    if (res.success && res.data) {
      setReport(res.data)
    } else {
      setErrorMsg(res.error || t('error_failed'))
    }
    
    setIsGenerating(false)
  }

  // Render Helpers
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
    if (score >= 50) return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
    return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
  }
  
  const getScoreIcon = (score: number) => {
    if (score >= 80) return <ShieldCheck className="w-12 h-12" />
    if (score >= 50) return <ActivitySquare className="w-12 h-12" />
    return <HeartPulse className="w-12 h-12 animate-pulse" />
  }

  const getTimeFilterLabel = (filter: string) => {
    switch (filter) {
      case 'this_month': return t('this_month')
      case 'last_month': return t('last_month')
      case 'this_year': return t('this_year')
      default: return filter
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-500" />
            {t('title')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
          {[
            { id: 'this_month', label: t('this_month') },
            { id: 'last_month', label: t('last_month') },
            { id: 'this_year', label: t('this_year') },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => { setTimeFilter(f.id as any); setReport(null); }}
              className={clsx(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                timeFilter === f.id 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 rtl:-translate-x-1/3" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('total_spend', { period: getTimeFilterLabel(timeFilter) })}</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white relative z-10 text-start">
            {totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xl font-medium text-slate-400 ms-1">{currency}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 rtl:-translate-x-1/3" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('transactions_count')}</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white relative z-10 text-start">
            {transactionCount} <span className="text-lg font-medium text-slate-500 ms-1">{t('receipts')}</span>
          </p>
        </div>
      </div>

      {/* AI Generate Button Area */}
      {!report && !isGenerating && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten" />
          
          <BrainCircuit className="w-16 h-16 text-indigo-500 mb-6 relative z-10" />
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">{t('ready_title')}</h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto mb-8 relative z-10">
            {t('ready_desc')}
          </p>
          
          <button 
            onClick={handleGenerateReport}
            disabled={filteredExpenses.length === 0}
            className="relative z-10 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-3 group"
          >
            <Sparkles className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
            {t('generate_btn')}
          </button>
          
          {filteredExpenses.length === 0 && (
            <p className="mt-4 text-sm text-rose-500 font-medium relative z-10">{t('no_transactions')}</p>
          )}
          
          {errorMsg && (
            <p className="mt-4 text-sm text-rose-500 font-medium relative z-10">{errorMsg}</p>
          )}
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{t('analyzing_title')}</h3>
          <p className="text-slate-500 mt-2">{t('analyzing_desc')}</p>
        </div>
      )}

      {/* AI Report Result */}
      {report && !isGenerating && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          
          {/* Top Row: Score */}
          <div className={clsx("rounded-3xl p-8 border flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden", getScoreColor(report.score))}>
            <div className="absolute inset-0 bg-white/40 dark:bg-black/20" />
            <div className="relative z-10 flex flex-col items-center">
              {getScoreIcon(report.score)}
              <h3 className="text-lg font-bold mt-4 opacity-80">{t('health_score')}</h3>
              <div className="text-6xl font-black my-2">{report.score}<span className="text-3xl opacity-50">/100</span></div>
              <p className="text-lg font-medium">{report.score_message}</p>
            </div>
          </div>
          
          {/* Grid: Behaviors & Advice */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Behaviors */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6 text-start">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-indigo-500" />
                </div>
                {t('behavior_analysis')}
              </h3>
              <ul className="space-y-4">
                {report.behaviors.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-400 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed text-start">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Advice */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6 text-start">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5 text-emerald-500" />
                </div>
                {t('action_plan')}
              </h3>
              <ul className="space-y-4">
                {report.advice.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed text-start">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Anomalies (If any) */}
          {report.anomalies && report.anomalies.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-900/10 rounded-3xl p-6 border border-rose-200 dark:border-rose-500/20 shadow-sm flex flex-col">
              <h3 className="text-xl font-bold text-rose-700 dark:text-rose-400 flex items-center gap-3 mb-6 text-start">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                {t('anomalies')}
              </h3>
              <ul className="space-y-4">
                {report.anomalies.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-rose-900 dark:text-rose-200 leading-relaxed font-medium text-start">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
      
    </div>
  )
}
