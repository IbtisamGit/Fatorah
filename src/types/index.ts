// ============================================================
// Fatorah — Shared TypeScript Types
// ============================================================

export type Category = {
  id: string
  user_id: string | null   // null = default system category
  name: string
  color_hex: string
  icon_name: string
  created_at: string
}

export type Expense = {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  merchant_name: string
  transaction_date: string   // ISO date: "YYYY-MM-DD"
  receipt_image_url: string | null
  ocr_raw_text: string | null
  created_at: string
  // Joined field (when fetched with category data)
  category?: Category
}

export type UserProfile = {
  id: string
  email: string
  monthly_budget_limit: number | null
  created_at: string
}

// ---- Form / UI Helpers ----

export type ExpenseFormData = {
  merchant_name: string
  amount: number
  transaction_date: string
  category_id: string
  notes?: string
}

export type OCRResult = {
  merchantName: string | null
  totalAmount: number | null
  date: string | null          // "YYYY-MM-DD"
  category: string | null      // category name string from AI
}
