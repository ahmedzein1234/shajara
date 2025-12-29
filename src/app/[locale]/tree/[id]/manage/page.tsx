import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { ManageTreeClient } from './ManageTreeClient';
import { getSession } from '@/lib/auth/actions';
import { getTreeInvitations, getTreeCollaborators, getTreeWithAccess } from '@/lib/db/invitation-actions';
import { getTreePrivacySettings } from '@/lib/db/privacy-actions';

interface ManageTreePageProps {
  params: Promise<{ id: string }>;
}

export default async function ManageTreePage({ params }: ManageTreePageProps) {
  const { id: treeId } = await params;
  const locale = await getLocale();
  const session = await getSession();

  if (!session?.user) {
    redirect(`/${locale}/login?redirect=/tree/${treeId}/manage`);
  }

  const tree = await getTreeWithAccess(treeId);

  if (!tree) {
    redirect(`/${locale}/tree`);
  }

  const [invitations, collaborators, privacySettings] = await Promise.all([
    getTreeInvitations(treeId),
    getTreeCollaborators(treeId),
    getTreePrivacySettings(treeId),
  ]);

  return (
    <ManageTreeClient
      tree={tree}
      invitations={invitations}
      collaborators={collaborators}
      currentUserId={session.user.id}
      locale={locale as 'ar' | 'en'}
      privacySettings={privacySettings}
    />
  );
}
