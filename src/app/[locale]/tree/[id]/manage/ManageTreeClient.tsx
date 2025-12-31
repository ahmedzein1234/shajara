'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, ArrowRight, ArrowLeft, UserPlus, Users, Crown, TreeDeciduous, Shield, Activity, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollaboratorsList, PendingInvitations } from '@/components/invitations';
import { MultiChannelInviteModal } from '@/components/sharing';
import { PrivacySettingsPanel } from '@/components/privacy';
import { SmartSuggestions, DuplicateDetector, DataQualityReport } from '@/components/smart';
import { type TreeInvitation, type TreeCollaborator, getTreeInvitations, getTreeCollaborators } from '@/lib/db/invitation-actions';
import { type TreePrivacySettings, getTreePrivacySettings } from '@/lib/db/privacy-actions';

interface ManageTreeClientProps {
  tree: {
    id: string;
    name_ar: string;
    name_en: string;
    owner_id: string;
    owner_name: string;
    isOwner: boolean;
    userRole: string;
  };
  invitations: TreeInvitation[];
  collaborators: TreeCollaborator[];
  currentUserId: string;
  locale: 'ar' | 'en';
  privacySettings?: TreePrivacySettings | null;
}

const translations = {
  ar: {
    title: 'إدارة الشجرة',
    back: 'العودة للشجرة',
    inviteButton: 'دعوة عضو جديد',
    owner: 'المالك',
    ownerLabel: 'مالك الشجرة',
    collaboratorsSection: 'الأعضاء والصلاحيات',
    invitationsSection: 'الدعوات',
    noPermission: 'ليس لديك صلاحية لإدارة هذه الشجرة',
    tabs: {
      members: 'الأعضاء',
      privacy: 'الخصوصية',
      smart: 'الذكاء الاصطناعي',
    },
    engagement: 'تفاعل العائلة',
  },
  en: {
    title: 'Manage Tree',
    back: 'Back to Tree',
    inviteButton: 'Invite Member',
    owner: 'Owner',
    ownerLabel: 'Tree Owner',
    collaboratorsSection: 'Members & Permissions',
    invitationsSection: 'Invitations',
    noPermission: 'You do not have permission to manage this tree',
    tabs: {
      members: 'Members',
      privacy: 'Privacy',
      smart: 'AI Features',
    },
    engagement: 'Family Engagement',
  },
};

export function ManageTreeClient({
  tree,
  invitations: initialInvitations,
  collaborators: initialCollaborators,
  currentUserId,
  locale,
  privacySettings,
}: ManageTreeClientProps) {
  const t = translations[locale];
  const router = useRouter();
  const BackArrow = locale === 'ar' ? ArrowRight : ArrowLeft;

  const [activeTab, setActiveTab] = React.useState<'members' | 'privacy' | 'smart'>('members');
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [invitations, setInvitations] = React.useState(initialInvitations);
  const [collaborators, setCollaborators] = React.useState(initialCollaborators);

  const canInvite = tree.isOwner || tree.userRole === 'manager';
  const canManagePrivacy = tree.isOwner || tree.userRole === 'manager';

  const refreshData = async () => {
    const [newInvitations, newCollaborators] = await Promise.all([
      getTreeInvitations(tree.id),
      getTreeCollaborators(tree.id),
    ]);
    setInvitations(newInvitations);
    setCollaborators(newCollaborators);
  };

  const treeName = locale === 'ar' ? tree.name_ar : tree.name_en;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/tree/${tree.id}`}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <BackArrow className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-400" />
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t.title}
                  </h1>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                  <TreeDeciduous className="w-4 h-4" />
                  {treeName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}/tree/${tree.id}/engagement`}
                className="px-3 py-2 text-sm text-islamic-primary hover:bg-islamic-light dark:hover:bg-islamic-primary/20 rounded-lg flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                {t.engagement}
              </Link>
              {canInvite && activeTab === 'members' && (
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <UserPlus className="w-4 h-4 me-2" />
                  {t.inviteButton}
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 -mb-px">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-islamic-primary text-islamic-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              {t.tabs.members}
            </button>
            {canManagePrivacy && (
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === 'privacy'
                    ? 'border-islamic-primary text-islamic-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Shield className="w-4 h-4" />
                {t.tabs.privacy}
              </button>
            )}
            <button
              onClick={() => setActiveTab('smart')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'smart'
                  ? 'border-islamic-primary text-islamic-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {t.tabs.smart}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {activeTab === 'members' ? (
            <>
              {/* Owner Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    {t.ownerLabel}
                  </h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                      {tree.owner_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {tree.owner_name}
                        {tree.owner_id === currentUserId && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 ms-2">
                            ({locale === 'ar' ? 'أنت' : 'You'})
                          </span>
                        )}
                      </p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                        <Crown className="w-3 h-3" />
                        {t.owner}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collaborators */}
              <CollaboratorsList
                treeId={tree.id}
                ownerId={tree.owner_id}
                collaborators={collaborators}
                currentUserId={currentUserId}
                onUpdate={refreshData}
              />

              {/* Pending Invitations */}
              {canInvite && (
                <PendingInvitations
                  invitations={invitations}
                  onUpdate={refreshData}
                />
              )}
            </>
          ) : activeTab === 'privacy' ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <PrivacySettingsPanel
                treeId={tree.id}
                locale={locale}
                initialSettings={privacySettings}
              />
            </div>
          ) : (
            /* Smart Features Tab */
            <div className="space-y-6">
              {/* Data Quality Report */}
              <DataQualityReport
                treeId={tree.id}
                locale={locale}
                onMemberClick={(memberId) => router.push(`/${locale}/tree/${tree.id}/member/${memberId}`)}
              />

              {/* Duplicate Detector */}
              <DuplicateDetector
                treeId={tree.id}
                locale={locale}
              />

              {/* Smart Suggestions */}
              <SmartSuggestions
                treeId={tree.id}
                locale={locale}
                onMemberClick={(memberId) => router.push(`/${locale}/tree/${tree.id}/member/${memberId}`)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Multi-Channel Invite Modal */}
      <MultiChannelInviteModal
        treeId={tree.id}
        treeName={tree.name_en}
        treeNameAr={tree.name_ar}
        inviterName={tree.owner_name}
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          refreshData();
        }}
        locale={locale}
      />
    </div>
  );
}
