import { getLocale } from 'next-intl/server';
import { InviteClient } from './InviteClient';
import { getInvitationByCode } from '@/lib/db/invitation-actions';
import { getSession } from '@/lib/auth/actions';

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const locale = await getLocale();
  const invitation = await getInvitationByCode(code);
  const session = await getSession();

  return (
    <InviteClient
      invitation={invitation}
      code={code}
      locale={locale as 'ar' | 'en'}
      isLoggedIn={!!session?.user}
      userEmail={session?.user?.email}
    />
  );
}
