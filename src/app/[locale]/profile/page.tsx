import { redirect } from 'next/navigation';
import { getSession, getReferralInfo } from '@/lib/auth/actions';
import ProfileClient from './ProfileClient';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const referralInfo = await getReferralInfo();

  return (
    <ProfileClient
      user={session.user}
      referralInfo={referralInfo}
      locale={locale as 'ar' | 'en'}
    />
  );
}
