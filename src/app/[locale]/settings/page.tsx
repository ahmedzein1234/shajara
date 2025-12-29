import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/actions';
import { getUserPrivacyPreferences } from '@/lib/privacy/actions';
import SettingsClient from './SettingsClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const privacyPrefs = await getUserPrivacyPreferences();

  return (
    <SettingsClient
      locale={locale}
      user={session.user}
      privacyPrefs={privacyPrefs}
    />
  );
}
