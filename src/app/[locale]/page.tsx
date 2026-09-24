import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/button';
import {Link} from '@/i18n/routing';

export default function HomePage() {
  const t = useTranslations('Index');
  const tAuth = useTranslations('Auth');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center space-y-6 max-w-md w-full bg-white p-8 rounded-xl shadow-sm border">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">{t('title')}</h1>
          <p className="text-gray-500">{t('description')}</p>
        </div>
        
        <div className="flex flex-col space-y-3 pt-6">
          <Link href="/login" className="w-full">
            <Button className="w-full" size="lg">
              {tAuth('login')}
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full" size="lg">
              {tAuth('signup')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
