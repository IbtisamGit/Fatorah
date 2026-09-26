import { getTranslations } from 'next-intl/server'
import { CategoriesClient } from './CategoriesClient'

export default async function CategoriesPage() {
  const t = await getTranslations('Categories')
  const tSidebar = await getTranslations('Sidebar')
  
  return (
    <div className="w-full h-full flex flex-col p-6 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{tSidebar('categories')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
      </div>

      <div className="flex-1 overflow-auto">
        <CategoriesClient />
      </div>
    </div>
  )
}
