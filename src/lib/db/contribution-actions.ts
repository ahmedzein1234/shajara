'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/actions';

// =====================================================
// TYPES
// =====================================================

export type ContributionRequestType = 'photo' | 'info' | 'memory' | 'relative' | 'verification' | 'correction';
export type ContributionStatus = 'open' | 'fulfilled' | 'closed' | 'expired';
export type ContributionPriority = 'low' | 'normal' | 'high';
export type ResponseType = 'photo' | 'text' | 'audio' | 'document' | 'correction';
export type ResponseStatus = 'pending' | 'approved' | 'rejected';

export interface ContributionRequest {
  id: string;
  tree_id: string;
  person_id: string | null;
  request_type: ContributionRequestType;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  requested_fields: string | null;
  status: ContributionStatus;
  priority: ContributionPriority;
  requested_by: string;
  fulfilled_by: string | null;
  fulfilled_at: number | null;
  share_code: string | null;
  is_public: boolean;
  expires_at: number | null;
  created_at: number;
  updated_at: number;
  // Joined fields
  requester_name?: string;
  person_name_ar?: string;
  person_name_en?: string;
  response_count?: number;
}

export interface ContributionResponse {
  id: string;
  request_id: string;
  contributor_id: string | null;
  contributor_name: string | null;
  contributor_email: string | null;
  contributor_relation: string | null;
  response_type: ResponseType;
  content: string | null;
  media_url: string | null;
  status: ResponseStatus;
  reviewed_by: string | null;
  reviewed_at: number | null;
  rejection_reason: string | null;
  created_at: number;
}

// =====================================================
// HELPERS
// =====================================================

async function getDB() {
  const { env } = await getCloudflareContext();
  return env.DB;
}

function generateId(): string {
  return 'contrib-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateShareCode(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// =====================================================
// CONTRIBUTION REQUESTS
// =====================================================

export async function createContributionRequest(
  treeId: string,
  data: {
    personId?: string;
    requestType: ContributionRequestType;
    titleAr?: string;
    titleEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    requestedFields?: string[];
    priority?: ContributionPriority;
    isPublic?: boolean;
    expiresInDays?: number;
  }
): Promise<{ success: boolean; request?: ContributionRequest; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);
    const id = generateId();
    const shareCode = generateShareCode();
    const expiresAt = data.expiresInDays
      ? now + (data.expiresInDays * 24 * 60 * 60)
      : null;

    await db.prepare(`
      INSERT INTO contribution_requests (
        id, tree_id, person_id, request_type, title_ar, title_en,
        description_ar, description_en, requested_fields, status, priority,
        requested_by, share_code, is_public, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      treeId,
      data.personId || null,
      data.requestType,
      data.titleAr || null,
      data.titleEn || null,
      data.descriptionAr || null,
      data.descriptionEn || null,
      data.requestedFields ? JSON.stringify(data.requestedFields) : null,
      data.priority || 'normal',
      session.user.id,
      shareCode,
      data.isPublic ? 1 : 0,
      expiresAt,
      now,
      now
    ).run();

    const request = await getContributionRequest(id);
    return { success: true, request: request || undefined };
  } catch (error) {
    console.error('Create contribution request error:', error);
    return { success: false, error: 'Failed to create contribution request' };
  }
}

export async function getContributionRequest(requestId: string): Promise<ContributionRequest | null> {
  try {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT cr.*, u.name as requester_name,
             p.name_ar as person_name_ar, p.name_en as person_name_en,
             (SELECT COUNT(*) FROM contribution_responses WHERE request_id = cr.id) as response_count
      FROM contribution_requests cr
      LEFT JOIN users u ON cr.requested_by = u.id
      LEFT JOIN persons p ON cr.person_id = p.id
      WHERE cr.id = ?
    `).bind(requestId).first();

    if (!result) return null;

    return {
      ...result,
      is_public: result.is_public === 1,
    } as ContributionRequest;
  } catch (error) {
    console.error('Get contribution request error:', error);
    return null;
  }
}

export async function getContributionRequestByShareCode(shareCode: string): Promise<ContributionRequest | null> {
  try {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT cr.*, u.name as requester_name,
             p.name_ar as person_name_ar, p.name_en as person_name_en
      FROM contribution_requests cr
      LEFT JOIN users u ON cr.requested_by = u.id
      LEFT JOIN persons p ON cr.person_id = p.id
      WHERE cr.share_code = ?
    `).bind(shareCode).first();

    if (!result) return null;

    return {
      ...result,
      is_public: result.is_public === 1,
    } as ContributionRequest;
  } catch (error) {
    console.error('Get contribution request by share code error:', error);
    return null;
  }
}

export async function getTreeContributionRequests(
  treeId: string,
  options?: { status?: ContributionStatus; limit?: number; offset?: number }
): Promise<ContributionRequest[]> {
  try {
    const db = await getDB();
    let query = `
      SELECT cr.*, u.name as requester_name,
             p.name_ar as person_name_ar, p.name_en as person_name_en,
             (SELECT COUNT(*) FROM contribution_responses WHERE request_id = cr.id) as response_count
      FROM contribution_requests cr
      LEFT JOIN users u ON cr.requested_by = u.id
      LEFT JOIN persons p ON cr.person_id = p.id
      WHERE cr.tree_id = ?
    `;
    const params: (string | number)[] = [treeId];

    if (options?.status) {
      query += ' AND cr.status = ?';
      params.push(options.status);
    }

    query += ' ORDER BY cr.created_at DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      if (options?.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const results = await db.prepare(query).bind(...params).all();

    return (results.results || []).map((r: Record<string, unknown>) => ({
      ...r,
      is_public: r.is_public === 1,
    })) as ContributionRequest[];
  } catch (error) {
    console.error('Get tree contribution requests error:', error);
    return [];
  }
}

export async function updateContributionRequestStatus(
  requestId: string,
  status: ContributionStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);

    const updates: string[] = ['status = ?', 'updated_at = ?'];
    const values: (string | number | null)[] = [status, now];

    if (status === 'fulfilled') {
      updates.push('fulfilled_by = ?');
      values.push(session.user.id);
      updates.push('fulfilled_at = ?');
      values.push(now);
    }

    values.push(requestId);

    await db.prepare(`
      UPDATE contribution_requests SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return { success: true };
  } catch (error) {
    console.error('Update contribution request status error:', error);
    return { success: false, error: 'Failed to update status' };
  }
}

// =====================================================
// CONTRIBUTION RESPONSES
// =====================================================

export async function submitContributionResponse(
  requestId: string,
  data: {
    contributorName?: string;
    contributorEmail?: string;
    contributorRelation?: string;
    responseType: ResponseType;
    content?: string;
    mediaUrl?: string;
  }
): Promise<{ success: boolean; response?: ContributionResponse; error?: string }> {
  try {
    const session = await getSession();
    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);
    const id = 'resp-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

    await db.prepare(`
      INSERT INTO contribution_responses (
        id, request_id, contributor_id, contributor_name, contributor_email,
        contributor_relation, response_type, content, media_url, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      id,
      requestId,
      session?.user?.id || null,
      data.contributorName || null,
      data.contributorEmail || null,
      data.contributorRelation || null,
      data.responseType,
      data.content || null,
      data.mediaUrl || null,
      now
    ).run();

    const response = await db.prepare(
      'SELECT * FROM contribution_responses WHERE id = ?'
    ).bind(id).first() as ContributionResponse | null;

    return { success: true, response: response || undefined };
  } catch (error) {
    console.error('Submit contribution response error:', error);
    return { success: false, error: 'Failed to submit response' };
  }
}

export async function getContributionResponses(requestId: string): Promise<ContributionResponse[]> {
  try {
    const db = await getDB();
    const results = await db.prepare(`
      SELECT * FROM contribution_responses
      WHERE request_id = ?
      ORDER BY created_at DESC
    `).bind(requestId).all();

    return (results.results || []) as unknown as ContributionResponse[];
  } catch (error) {
    console.error('Get contribution responses error:', error);
    return [];
  }
}

export async function reviewContributionResponse(
  responseId: string,
  decision: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);

    await db.prepare(`
      UPDATE contribution_responses
      SET status = ?, reviewed_by = ?, reviewed_at = ?, rejection_reason = ?
      WHERE id = ?
    `).bind(
      decision,
      session.user.id,
      now,
      decision === 'rejected' ? rejectionReason || null : null,
      responseId
    ).run();

    return { success: true };
  } catch (error) {
    console.error('Review contribution response error:', error);
    return { success: false, error: 'Failed to review response' };
  }
}
