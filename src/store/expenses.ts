import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export type Category = {
  id: string
  user_id?: string | null
  name: string
  color_hex: string
  icon_name: string
}

export type Expense = {
  id: string
  merchant: string
  amount: number
  tax: number
  date: string
  category: string // Storing string name for UI mapping
  status: 'Saved' | 'Pending'
  source: 'Manual' | 'Scanner'
  currency?: string
  previewUrl?: string
  fileType?: string
}

type ExpenseStore = {
  expenses: Expense[]
  categories: Category[]
  isLoading: boolean
  fetchExpenses: () => Promise<void>
  fetchCategories: () => Promise<void>
  addExpense: (expense: Expense) => Promise<void>
  removeExpense: (id: string) => Promise<void>
  updateExpense: (id: string, updated: Partial<Expense>) => Promise<void>
  addCategory: (category: Partial<Category>) => Promise<void>
  removeCategory: (id: string) => Promise<void>
  updateCategory: (id: string, updated: Partial<Category>) => Promise<void>
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  categories: [],
  isLoading: true, // start true — skeleton shows immediately, never flashes "empty"
  
  fetchCategories: async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (data && !error) set({ categories: data })
  },

  fetchExpenses: async () => {
    set({ isLoading: true })
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ isLoading: false }); return }
    
    // Also fetch categories to map UUIDs
    const [{ data: exps, error }, { data: cats }] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false }),
      supabase.from('categories').select('*')
    ])
      
    if (exps && !error) {
      if (cats) set({ categories: cats })
      
      const mapped = await Promise.all(exps.map(async (e) => {
        const cat = cats?.find(c => c.id === e.category_id)
        
        let previewUrl = e.receipt_url
        // If it's a private bucket path (e.g. uuid/filename.jpg) instead of an http URL or base64
        if (e.receipt_url && !e.receipt_url.startsWith('http') && !e.receipt_url.startsWith('data:')) {
          const { data } = await supabase.storage.from('receipts').createSignedUrl(e.receipt_url, 60 * 60 * 24) // 24 hours
          if (data?.signedUrl) {
            previewUrl = data.signedUrl
          }
        }
        
        return {
          id: e.id,
          merchant: e.merchant_name || 'Unknown',
          amount: e.amount || 0,
          date: e.transaction_date || e.created_at || new Date().toISOString(),
          category: cat ? cat.name : 'Other',
          tax: 0,
          status: 'Saved',
          source: 'Manual',
          previewUrl
        } as Expense
      }))
      set({ expenses: mapped, isLoading: false })
    } else {
      console.error('Error fetching expenses:', error)
      set({ isLoading: false })
    }
  },

  addCategory: async (category) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data, error } = await supabase.from('categories').insert([{
      name: category.name,
      color_hex: category.color_hex || '#94a3b8',
      icon_name: category.icon_name || 'tag',
      user_id: user.id
    }]).select().single()

    if (data && !error) {
      set(state => ({ categories: [...state.categories, data] }))
    }
  },

  removeCategory: async (id) => {
    const supabase = createClient()
    set(state => ({ categories: state.categories.filter(c => c.id !== id) }))
    await supabase.from('categories').delete().eq('id', id)
  },

  updateCategory: async (id, updated) => {
    const supabase = createClient()
    set(state => ({
      categories: state.categories.map(c => c.id === id ? { ...c, ...updated } : c)
    }))
    await supabase.from('categories').update(updated).eq('id', id)
  },

  addExpense: async (expense) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const dbReceiptUrl = expense.previewUrl
    let uiPreviewUrl = expense.previewUrl

    if (dbReceiptUrl && !dbReceiptUrl.startsWith('http') && !dbReceiptUrl.startsWith('data:')) {
      const { data } = await supabase.storage.from('receipts').createSignedUrl(dbReceiptUrl, 60 * 60 * 24)
      if (data?.signedUrl) {
        uiPreviewUrl = data.signedUrl
      }
    }
    
    set((state) => ({ expenses: [{ ...expense, previewUrl: uiPreviewUrl }, ...state.expenses] }))
    
    const { data: cats } = await supabase.from('categories').select('id, name')
    let category_id = null
    if (cats) {
      const match = cats.find(c => c.name.toLowerCase() === expense.category.toLowerCase())
      if (match) {
        category_id = match.id
      } else {
        const vibrantColors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e']
        const randomColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)]
        
        const { data: newCat, error: catErr } = await supabase.from('categories').insert([{
          name: expense.category,
          color_hex: randomColor,
          icon_name: 'tag',
          user_id: user.id
        }]).select('id').single()

        if (newCat && !catErr) {
          category_id = newCat.id
        } else {
          category_id = cats[0]?.id
        }
      }
    }
    
    const { error } = await supabase.from('expenses').insert([{ 
      user_id: user.id,
      merchant_name: expense.merchant,
      amount: expense.amount,
      transaction_date: expense.date,
      category_id,
      receipt_url: dbReceiptUrl
    }])
    
    if (error) {
      console.error('Error adding expense:', error)
      throw error
    }
  },

  removeExpense: async (id) => {
    const supabase = createClient()
    set((state) => ({ expenses: state.expenses.filter(e => e.id !== id) }))
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) console.error('Error deleting expense:', error)
  },

  updateExpense: async (id, updated) => {
    const supabase = createClient()
    set((state) => ({
      expenses: state.expenses.map(e => e.id === id ? { ...e, ...updated } : e)
    }))
    
    const { data: cats } = await supabase.from('categories').select('id, name')
    let category_id = undefined
    if (updated.category && cats) {
      const match = cats.find(c => c.name.toLowerCase() === updated.category!.toLowerCase())
      if (match) category_id = match.id
    }
    
    const updatePayload: any = {}
    if (updated.merchant) updatePayload.merchant_name = updated.merchant
    if (updated.amount !== undefined) updatePayload.amount = updated.amount
    if (updated.date) updatePayload.transaction_date = updated.date
    if (category_id) updatePayload.category_id = category_id
    if (updated.previewUrl) updatePayload.receipt_url = updated.previewUrl

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabase.from('expenses').update(updatePayload).eq('id', id)
      if (error) {
        console.error('Error updating expense:', error)
        throw error
      }
    }
  }
}))
