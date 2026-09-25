'use client'

import { useState, useEffect } from 'react'
import { useExpenseStore, type Category } from '@/store/expenses'
import { Plus, Edit2, Trash2, X, Check, Tag } from 'lucide-react'
import clsx from 'clsx'
import * as LucideIcons from 'lucide-react'

// Common colors for categories
const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', 
  '#64748b'
]

// Common icons for categories
const ICONS = [
  'Tag', 'ShoppingCart', 'Coffee', 'Car', 'Home', 
  'Zap', 'HeartPulse', 'Briefcase', 'GraduationCap', 'Plane',
  'Monitor', 'Utensils', 'Gift', 'Smile'
]

export function CategoriesClient() {
  const { categories, fetchCategories, addCategory, updateCategory, removeCategory } = useExpenseStore()
  
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', color_hex: COLORS[0], icon_name: ICONS[0] })

  const handleOpenNew = () => {
    setEditingCategory(null)
    setFormData({ name: '', color_hex: COLORS[0], icon_name: ICONS[0] })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormData({ name: cat.name, color_hex: cat.color_hex, icon_name: cat.icon_name || 'Tag' })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return
    
    // Check for exact duplicate name when creating
    if (!editingCategory && categories.some(c => c.name.toLowerCase() === formData.name.toLowerCase())) {
      alert('A category with this name already exists.')
      return
    }

    if (editingCategory) {
      await updateCategory(editingCategory.id, formData)
    } else {
      await addCategory(formData)
    }
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? Expenses using it might appear as "Other".')) {
      await removeCategory(id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">All Categories ({categories.length})</h2>
        <button 
          onClick={handleOpenNew}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map(cat => {
          // Dynamically load the lucide icon component
          const IconComponent = (LucideIcons as any)[cat.icon_name] || Tag

          return (
            <div key={cat.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-opacity-10 dark:bg-opacity-20"
                  style={{ backgroundColor: cat.color_hex + '20', color: cat.color_hex }}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{cat.name}</h3>
                  {cat.user_id ? (
                     <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full mt-1 inline-block">Custom</span>
                  ) : (
                     <span className="text-xs text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenEdit(cat)}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {cat.user_id && (
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Subscriptions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color Theme</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({...formData, color_hex: color})}
                      className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                        formData.color_hex === color ? "ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-slate-900" : ""
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {formData.color_hex === color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Icon</label>
                <div className="grid grid-cols-7 gap-2">
                  {ICONS.map(iconName => {
                    const IconComp = (LucideIcons as any)[iconName] || Tag
                    return (
                      <button
                        key={iconName}
                        onClick={() => setFormData({...formData, icon_name: iconName})}
                        className={clsx(
                          "aspect-square rounded-xl flex items-center justify-center transition-colors",
                          formData.icon_name === iconName 
                            ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900" 
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        <IconComp className="w-5 h-5" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.name.trim()}
                className="px-5 py-2.5 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
