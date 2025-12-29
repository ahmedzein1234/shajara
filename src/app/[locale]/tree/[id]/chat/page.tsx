import { getCloudflareContext } from '@opennextjs/cloudflare';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/actions';
import { getOrCreateTreeChatRoom } from '@/lib/db/chat-actions';
import { ChatClient } from './ChatClient';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { locale, id: treeId } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  const { env } = await getCloudflareContext();
  const db = env.DB;

  // Get tree details
  const tree = await db.prepare(`
    SELECT t.*, u.name as owner_name
    FROM trees t
    LEFT JOIN users u ON t.owner_id = u.id
    WHERE t.id = ?
  `).bind(treeId).first() as {
    id: string;
    name_ar: string;
    name_en: string;
    owner_id: string;
    owner_name: string;
  } | null;

  if (!tree) {
    redirect(`/${locale}/dashboard`);
  }

  // Check if user has access to this tree
  const collaborator = await db.prepare(`
    SELECT role FROM tree_collaborators WHERE tree_id = ? AND user_id = ?
  `).bind(treeId, session.user.id).first();

  const isOwner = tree.owner_id === session.user.id;

  if (!isOwner && !collaborator) {
    redirect(`/${locale}/dashboard`);
  }

  // Get or create chat room
  const chatRoom = await getOrCreateTreeChatRoom(treeId);

  if (!chatRoom) {
    redirect(`/${locale}/tree/${treeId}`);
  }

  return (
    <ChatClient
      tree={{
        id: tree.id,
        name_ar: tree.name_ar,
        name_en: tree.name_en,
      }}
      roomId={chatRoom.id}
      currentUserId={session.user.id}
      locale={locale as 'ar' | 'en'}
    />
  );
}
