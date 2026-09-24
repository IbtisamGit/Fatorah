import { useTranslations } from 'next-intl';

export default function OverviewPage() {
  const t = useTranslations('Sidebar');
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{t('overview')}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-sm text-gray-500">Total Spent this month</h3>
          <p className="text-3xl font-bold mt-2">SAR 4,200</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-sm text-gray-500">Monthly Budget</h3>
          <p className="text-3xl font-bold mt-2">SAR 5,000</p>
        </div>
      </div>
    </div>
  );
}
