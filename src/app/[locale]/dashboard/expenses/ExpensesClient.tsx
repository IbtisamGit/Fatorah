'use client'

import { useState, useEffect } from 'react'
import {
  Search, Filter, Plus, Edit2, Trash2, Receipt, Tag, Camera, PenLine
} from 'lucide-react'
import clsx from 'clsx'
import { useRouter } from '@/i18n/routing'
import { useExpenseStore } from '@/store/expenses'
import * as LucideIcons from 'lucide-react'

// Helper to get consistent dynamic category styles from global store categories
const getCategoryStyle = (catName: string, globalCategories: any[]) => {
  const cat = globalCategories.find(c => c.name.toLowerCase() === catName.toLowerCase())
  if (cat) {
    return {
      name: cat.name,
      colorHex: cat.color_hex,
      iconName: cat.icon_name
    }
  }
  return { name: catName, colorHex: '#94a3b8', iconName: 'Tag' }
}

export function ExpensesClient() {
  const router = useRouter()
  const { expenses: globalExpenses, categories: globalCategories, addExpense, removeExpense, updateExpense, fetchExpenses, fetchCategories } = useExpenseStore()
  
  useEffect(() => {
    fetchExpenses()
    fetchCategories()
  }, [fetchExpenses, fetchCategories])
  
  // Map global store format to local format for display
  const expenses = globalExpenses.map(ge => {
    const style = getCategoryStyle(ge.category, globalCategories)
    return {
      id: ge.id,
      merchant: ge.merchant,
      date: ge.date.split('T')[0],
      amount: ge.amount,
      categoryName: style.name,
      categoryColor: style.colorHex,
      categoryIcon: style.iconName,
      previewUrl: ge.previewUrl
    }
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('All')

  // Unique categories for the filter dropdown
  const uniqueCategories = Array.from(new Set(globalCategories.map(c => c.name)))

  // Modal State
  const [isSelectionOpen, setIsSelectionOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: uniqueCategories[0] || 'Other'
  })

  const handleAddClick = () => setIsSelectionOpen(true)

  const openManualModal = () => {
    setIsSelectionOpen(false)
    setEditingExpense(null)
    setFormData({
      merchant: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: uniqueCategories[0] || 'Other'
    })
    setIsModalOpen(true)
  }

  const handleEditClick = (expense: any) => {
    setEditingExpense(expense)
    setFormData({
      merchant: expense.merchant,
      amount: expense.amount.toString(),
      date: expense.date,
      category: expense.categoryName
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      removeExpense(id)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.merchant || !formData.amount) return

    const amountNum = parseFloat(formData.amount)

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        merchant: formData.merchant,
        amount: amountNum,
        date: formData.date,
        category: formData.category
      })
    } else {
      addExpense({
        id: Math.random().toString(36).substring(7),
        merchant: formData.merchant,
        amount: amountNum,
        date: formData.date,
        category: formData.category,
        tax: 0,
        status: 'Saved',
        source: 'Manual'
      })
    }
    setIsModalOpen(false)
  }

  // Filter logic
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.merchant.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'All' || exp.categoryName === filterCategory
    return matchesSearch && matchesCategory
  })

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown Date'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Area */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Expenses</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and track your financial transactions.</p>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar (Search, Filter, Add Button) */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search merchant..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-slate-200 transition-colors"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors cursor-pointer"
              >
                <option value="All">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Add Expense Button */}
          <button 
            onClick={handleAddClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(expense => {
                  const CatIcon = (LucideIcons as any)[expense.categoryIcon] || Tag
                  return (
                    <tr 
                      key={expense.id} 
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            {expense.previewUrl ? (
                              <img src={expense.previewUrl} className="w-full h-full object-cover" />
                            ) : (
                              <Receipt className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{expense.merchant}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ID: #{expense.id.split('-')[0] || expense.id.padStart(5, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                          {formatDate(expense.date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-white/20"
                          style={{ backgroundColor: expense.categoryColor + '20', color: expense.categoryColor }}
                        >
                          <CatIcon className="w-3.5 h-3.5" />
                          {expense.categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(expense.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditClick(expense)}
                            className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(expense.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                /* Empty State */
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">No expenses found</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                        {searchTerm || filterCategory !== 'All' 
                          ? "We couldn't find any expenses matching your filters. Try clearing them."
                          : "You haven't logged any expenses yet. Start tracking your spending by adding a new expense."}
                      </p>
                      {(searchTerm || filterCategory !== 'All') ? (
                        <button 
                          onClick={() => { setSearchTerm(''); setFilterCategory('All'); }}
                          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <button 
                          onClick={handleAddClick}
                          className="flex items-center gap-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add your first expense
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selection Modal (Scan vs Manual) */}
      {isSelectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <button 
              onClick={() => setIsSelectionOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
              ✕
            </button>

            <div className="text-center mb-8 mt-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">How would you like to add it?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Choose a method to record your expense.</p>
            </div>

            <div className="grid gap-4">
              {/* Option 1: Scan Receipt */}
              <button 
                onClick={() => {
                  setIsSelectionOpen(false)
                  router.push('/dashboard/scanner')
                }}
                className="group relative flex items-center p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900 transition-all text-left overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Scan Receipt</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Smart AI extraction (Recommended)</p>
                </div>
              </button>

              {/* Option 2: Manual Entry */}
              <button 
                onClick={openManualModal}
                className="group relative flex items-center p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-900 transition-all text-left overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform duration-300">
                  <PenLine className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Enter Manually</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Type in the details yourself</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Merchant Name</label>
                <input 
                  type="text" required autoFocus
                  value={formData.merchant} onChange={e => setFormData({...formData, merchant: e.target.value})}
                  placeholder="e.g. Starbucks, Uber..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount ($)</label>
                  <input 
                    type="number" required min="0" step="0.01"
                    value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
                  <input 
                    type="date" required
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                <select
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-slate-100 cursor-pointer"
                >
                  {Object.keys(CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{CATEGORIES[cat].name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                >
                  {editingExpense ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
