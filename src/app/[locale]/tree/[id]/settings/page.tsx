import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/actions';
import { getTreeById } from '@/lib/db/actions';
import { getTreePrivacySettings, getUserAccessLevel } from '@/lib/privacy/actions';
import TreeSettingsClient from './TreeSettingsClient';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function TreeSettingsPage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const tree = await getTreeById(id);
  if (!tree) {
    redirect(`/${locale}/tree`);
  }

  // Check if user has admin access
  const access = await getUserAccessLevel(id, session.user.id);
  if (!access.isOwner && access.level !== 'admin' && access.level !== 'editor') {
    redirect(`/${locale}/tree/${id}`);
  }

  const privacySettings = await getTreePrivacySettings(id);

  return (
    <TreeSettingsClient
      tree={tree}
      privacySettings={privacySettings}
      locale={locale}
      isOwner={access.isOwner}
    />
  );
}
