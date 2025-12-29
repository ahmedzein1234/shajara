'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/actions';

// =====================================================
// TYPES
// =====================================================

export interface DuplicateCandidate {
  id: string;
  tree_id: string;
  member1_id: string;
  member2_id: string;
  similarity_score: number;
  match_reasons: string[];
  status: 'pending' | 'confirmed_duplicate' | 'not_duplicate' | 'merged';
  reviewed_by: string | null;
  reviewed_at: number | null;
  created_at: number;
  // Joined member data
  member1?: FamilyMemberBasic;
  member2?: FamilyMemberBasic;
}

export interface FamilyMemberBasic {
  id: string;
  first_name_ar: string;
  first_name_en: string | null;
  last_name_ar: string;
  last_name_en: string | null;
  birth_date: string | null;
  death_date: string | null;
  gender: string;
  photo_url: string | null;
}

export interface AISuggestion {
  id: string;
  tree_id: string;
  member_id: string | null;
  suggestion_type: SuggestionType;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  confidence: number;
  suggestion_data: Record<string, unknown>;
  status: 'pending' | 'accepted' | 'dismissed' | 'expired';
  acted_on_by: string | null;
  acted_on_at: number | null;
  expires_at: number | null;
  created_at: number;
  // Joined member data
  member?: FamilyMemberBasic;
}

export type SuggestionType =
  | 'relationship_hint'
  | 'missing_info'
  | 'date_correction'
  | 'name_suggestion'
  | 'potential_relative'
  | 'data_inconsistency';

export interface MemberQualityScore {
  id: string;
  member_id: string;
  tree_id: string;
  overall_score: number;
  completeness_score: number;
  accuracy_score: number;
  consistency_score: number;
  missing_fields: string[];
  issues: string[];
  last_calculated_at: number;
  // Joined member data
  member?: FamilyMemberBasic;
}

export interface TreeQualityMetrics {
  id: string;
  tree_id: string;
  total_members: number;
  members_with_photos: number;
  members_with_birth_date: number;
  members_with_birth_place: number;
  members_with_death_date: number;
  members_with_bio: number;
  average_completeness: number;
  duplicate_candidates_count: number;
  pending_suggestions_count: number;
  overall_health_score: number;
  last_calculated_at: number;
}

export interface MergeResult {
  success: boolean;
  error?: string;
  keptMemberId?: string;
}

// =====================================================
// FUZZY MATCHING UTILITIES
// =====================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function stringSimilarity(str1: string | null, str2: string | null): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - (distance / maxLength);
}

/**
 * Normalize Arabic text for comparison
 */
function normalizeArabic(text: string | null): string {
  if (!text) return '';
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '') // Remove diacritics
    .trim();
}

/**
 * Check if two dates are similar (within margin of error)
 */
function dateSimilarity(date1: string | null, date2: string | null): number {
  if (!date1 || !date2) return 0;

  // Parse years from dates
  const year1 = parseInt(date1.split('-')[0] || date1);
  const year2 = parseInt(date2.split('-')[0] || date2);

  if (isNaN(year1) || isNaN(year2)) return 0;

  const diff = Math.abs(year1 - year2);
  if (diff === 0) return 1;
  if (diff <= 2) return 0.8;
  if (diff <= 5) return 0.5;
  if (diff <= 10) return 0.3;
  return 0;
}

// =====================================================
// DUPLICATE DETECTION
// =====================================================

/**
 * Calculate similarity score between two family members
 */
function calculateMemberSimilarity(
  member1: FamilyMemberBasic,
  member2: FamilyMemberBasic
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let totalWeight = 0;
  let weightedScore = 0;

  // First name similarity (Arabic) - weight 30
  const firstName1Ar = normalizeArabic(member1.first_name_ar);
  const firstName2Ar = normalizeArabic(member2.first_name_ar);
  const firstNameSimAr = stringSimilarity(firstName1Ar, firstName2Ar);
  if (firstNameSimAr >= 0.8) {
    reasons.push('name_match_ar');
    weightedScore += firstNameSimAr * 30;
  }
  totalWeight += 30;

  // First name similarity (English) - weight 15
  if (member1.first_name_en && member2.first_name_en) {
    const firstNameSimEn = stringSimilarity(member1.first_name_en, member2.first_name_en);
    if (firstNameSimEn >= 0.8) {
      reasons.push('name_match_en');
      weightedScore += firstNameSimEn * 15;
    }
    totalWeight += 15;
  }

  // Last name similarity (Arabic) - weight 25
  const lastName1Ar = normalizeArabic(member1.last_name_ar);
  const lastName2Ar = normalizeArabic(member2.last_name_ar);
  const lastNameSimAr = stringSimilarity(lastName1Ar, lastName2Ar);
  if (lastNameSimAr >= 0.8) {
    reasons.push('family_name_match');
    weightedScore += lastNameSimAr * 25;
  }
  totalWeight += 25;

  // Birth date similarity - weight 20
  const birthDateSim = dateSimilarity(member1.birth_date, member2.birth_date);
  if (birthDateSim >= 0.5) {
    reasons.push('birth_date_match');
    weightedScore += birthDateSim * 20;
  }
  totalWeight += 20;

  // Death date similarity - weight 10
  if (member1.death_date && member2.death_date) {
    const deathDateSim = dateSimilarity(member1.death_date, member2.death_date);
    if (deathDateSim >= 0.5) {
      reasons.push('death_date_match');
      weightedScore += deathDateSim * 10;
    }
    totalWeight += 10;
  }

  // Gender match - weight 10 (must match for high score)
  if (member1.gender === member2.gender) {
    reasons.push('gender_match');
    weightedScore += 10;
  } else {
    // Different genders significantly reduces score
    weightedScore -= 20;
  }
  totalWeight += 10;

  const finalScore = Math.max(0, Math.min(1, weightedScore / totalWeight));

  return { score: finalScore, reasons };
}

/**
 * Scan tree for potential duplicates
 */
export async function scanForDuplicates(
  treeId: string,
  threshold: number = 0.7
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, count: 0, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Get all members of the tree
    const members = await db.prepare(`
      SELECT id, first_name_ar, first_name_en, last_name_ar, last_name_en,
             birth_date, death_date, gender, photo_url
      FROM family_members
      WHERE tree_id = ?
    `).bind(treeId).all<FamilyMemberBasic>();

    if (!members.results || members.results.length < 2) {
      return { success: true, count: 0 };
    }

    const memberList = members.results;
    const duplicates: Array<{
      member1_id: string;
      member2_id: string;
      similarity_score: number;
      match_reasons: string[];
    }> = [];

    // Compare each pair of members
    for (let i = 0; i < memberList.length; i++) {
      for (let j = i + 1; j < memberList.length; j++) {
        const { score, reasons } = calculateMemberSimilarity(memberList[i], memberList[j]);

        if (score >= threshold && reasons.length >= 2) {
          duplicates.push({
            member1_id: memberList[i].id,
            member2_id: memberList[j].id,
            similarity_score: score,
            match_reasons: reasons,
          });
        }
      }
    }

    // Insert new duplicate candidates (ignore existing ones)
    for (const dup of duplicates) {
      await db.prepare(`
        INSERT INTO duplicate_candidates (tree_id, member1_id, member2_id, similarity_score, match_reasons)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (tree_id, member1_id, member2_id) DO UPDATE SET
          similarity_score = excluded.similarity_score,
          match_reasons = excluded.match_reasons
      `).bind(
        treeId,
        dup.member1_id,
        dup.member2_id,
        dup.similarity_score,
        JSON.stringify(dup.match_reasons)
      ).run();
    }

    return { success: true, count: duplicates.length };
  } catch (error) {
    console.error('Error scanning for duplicates:', error);
    return { success: false, count: 0, error: 'Failed to scan for duplicates' };
  }
}

/**
 * Get duplicate candidates for a tree
 */
export async function getDuplicateCandidates(
  treeId: string,
  status: 'pending' | 'all' = 'pending'
): Promise<DuplicateCandidate[]> {
  try {
    const session = await getSession();
    if (!session?.user) return [];

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const statusClause = status === 'pending' ? "AND dc.status = 'pending'" : '';

    const results = await db.prepare(`
      SELECT
        dc.*,
        m1.first_name_ar as m1_first_name_ar,
        m1.first_name_en as m1_first_name_en,
        m1.last_name_ar as m1_last_name_ar,
        m1.last_name_en as m1_last_name_en,
        m1.birth_date as m1_birth_date,
        m1.death_date as m1_death_date,
        m1.gender as m1_gender,
        m1.photo_url as m1_photo_url,
        m2.first_name_ar as m2_first_name_ar,
        m2.first_name_en as m2_first_name_en,
        m2.last_name_ar as m2_last_name_ar,
        m2.last_name_en as m2_last_name_en,
        m2.birth_date as m2_birth_date,
        m2.death_date as m2_death_date,
        m2.gender as m2_gender,
        m2.photo_url as m2_photo_url
      FROM duplicate_candidates dc
      JOIN family_members m1 ON dc.member1_id = m1.id
      JOIN family_members m2 ON dc.member2_id = m2.id
      WHERE dc.tree_id = ? ${statusClause}
      ORDER BY dc.similarity_score DESC
    `).bind(treeId).all();

    return (results.results || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      tree_id: row.tree_id as string,
      member1_id: row.member1_id as string,
      member2_id: row.member2_id as string,
      similarity_score: row.similarity_score as number,
      match_reasons: JSON.parse((row.match_reasons as string) || '[]'),
      status: row.status as DuplicateCandidate['status'],
      reviewed_by: row.reviewed_by as string | null,
      reviewed_at: row.reviewed_at as number | null,
      created_at: row.created_at as number,
      member1: {
        id: row.member1_id as string,
        first_name_ar: row.m1_first_name_ar as string,
        first_name_en: row.m1_first_name_en as string | null,
        last_name_ar: row.m1_last_name_ar as string,
        last_name_en: row.m1_last_name_en as string | null,
        birth_date: row.m1_birth_date as string | null,
        death_date: row.m1_death_date as string | null,
        gender: row.m1_gender as string,
        photo_url: row.m1_photo_url as string | null,
      },
      member2: {
        id: row.member2_id as string,
        first_name_ar: row.m2_first_name_ar as string,
        first_name_en: row.m2_first_name_en as string | null,
        last_name_ar: row.m2_last_name_ar as string,
        last_name_en: row.m2_last_name_en as string | null,
        birth_date: row.m2_birth_date as string | null,
        death_date: row.m2_death_date as string | null,
        gender: row.m2_gender as string,
        photo_url: row.m2_photo_url as string | null,
      },
    }));
  } catch (error) {
    console.error('Error getting duplicate candidates:', error);
    return [];
  }
}

/**
 * Resolve a duplicate candidate
 */
export async function resolveDuplicateCandidate(
  candidateId: string,
  resolution: 'not_duplicate' | 'confirmed_duplicate'
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    await db.prepare(`
      UPDATE duplicate_candidates
      SET status = ?, reviewed_by = ?, reviewed_at = unixepoch()
      WHERE id = ?
    `).bind(resolution, session.user.id, candidateId).run();

    return { success: true };
  } catch (error) {
    console.error('Error resolving duplicate:', error);
    return { success: false, error: 'Failed to resolve duplicate' };
  }
}

/**
 * Merge two duplicate members
 */
export async function mergeDuplicateMembers(
  candidateId: string,
  keepMemberId: string,
  fieldChoices: Record<string, 'member1' | 'member2'>
): Promise<MergeResult> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Get the duplicate candidate
    const candidate = await db.prepare(`
      SELECT * FROM duplicate_candidates WHERE id = ?
    `).bind(candidateId).first<DuplicateCandidate>();

    if (!candidate) {
      return { success: false, error: 'Candidate not found' };
    }

    const mergeMemberId = keepMemberId === candidate.member1_id
      ? candidate.member2_id
      : candidate.member1_id;

    // Get both member records
    const [keepMember, mergeMember] = await Promise.all([
      db.prepare('SELECT * FROM family_members WHERE id = ?').bind(keepMemberId).first(),
      db.prepare('SELECT * FROM family_members WHERE id = ?').bind(mergeMemberId).first(),
    ]);

    if (!keepMember || !mergeMember) {
      return { success: false, error: 'Members not found' };
    }

    // Build the merged data based on field choices
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const [field, choice] of Object.entries(fieldChoices)) {
      const sourceValue = choice === 'member1'
        ? (keepMemberId === candidate.member1_id ? keepMember : mergeMember)
        : (keepMemberId === candidate.member2_id ? keepMember : mergeMember);

      if (sourceValue && field in (sourceValue as Record<string, unknown>)) {
        updates.push(`${field} = ?`);
        values.push((sourceValue as Record<string, unknown>)[field]);
      }
    }

    // Update the kept member with merged fields
    if (updates.length > 0) {
      values.push(keepMemberId);
      await db.prepare(`
        UPDATE family_members SET ${updates.join(', ')} WHERE id = ?
      `).bind(...values).run();
    }

    // Update relationships pointing to merged member
    await db.prepare(`
      UPDATE family_members SET father_id = ? WHERE father_id = ?
    `).bind(keepMemberId, mergeMemberId).run();

    await db.prepare(`
      UPDATE family_members SET mother_id = ? WHERE mother_id = ?
    `).bind(keepMemberId, mergeMemberId).run();

    // Update spouse relationships
    await db.prepare(`
      UPDATE member_spouses SET member_id = ? WHERE member_id = ?
    `).bind(keepMemberId, mergeMemberId).run();

    await db.prepare(`
      UPDATE member_spouses SET spouse_id = ? WHERE spouse_id = ?
    `).bind(keepMemberId, mergeMemberId).run();

    // Save merge history
    await db.prepare(`
      INSERT INTO merge_history (tree_id, kept_member_id, merged_member_id, merged_data, field_choices, merged_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      candidate.tree_id,
      keepMemberId,
      mergeMemberId,
      JSON.stringify(mergeMember),
      JSON.stringify(fieldChoices),
      session.user.id
    ).run();

    // Delete the merged member
    await db.prepare(`
      DELETE FROM family_members WHERE id = ?
    `).bind(mergeMemberId).run();

    // Update duplicate candidate status
    await db.prepare(`
      UPDATE duplicate_candidates
      SET status = 'merged', reviewed_by = ?, reviewed_at = unixepoch()
      WHERE id = ?
    `).bind(session.user.id, candidateId).run();

    return { success: true, keptMemberId: keepMemberId };
  } catch (error) {
    console.error('Error merging duplicates:', error);
    return { success: false, error: 'Failed to merge members' };
  }
}

// =====================================================
// AI SUGGESTIONS
// =====================================================

/**
 * Generate AI suggestions for a tree
 */
export async function generateAISuggestions(
  treeId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, count: 0, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Get all members with their relationships
    const members = await db.prepare(`
      SELECT m.*,
             f.first_name_ar as father_first_name,
             mo.first_name_ar as mother_first_name
      FROM family_members m
      LEFT JOIN family_members f ON m.father_id = f.id
      LEFT JOIN family_members mo ON m.mother_id = mo.id
      WHERE m.tree_id = ?
    `).bind(treeId).all();

    if (!members.results) {
      return { success: true, count: 0 };
    }

    const suggestions: Array<{
      member_id: string | null;
      suggestion_type: SuggestionType;
      title_ar: string;
      title_en: string;
      description_ar: string;
      description_en: string;
      confidence: number;
      suggestion_data: Record<string, unknown>;
    }> = [];

    for (const member of members.results as Record<string, unknown>[]) {
      // Check for missing information
      const missingFields: string[] = [];

      if (!member.birth_date) missingFields.push('birth_date');
      if (!member.birth_place_ar) missingFields.push('birth_place');
      if (!member.photo_url) missingFields.push('photo');
      if (!member.bio_ar && !member.bio_en) missingFields.push('bio');

      if (missingFields.length > 0) {
        suggestions.push({
          member_id: member.id as string,
          suggestion_type: 'missing_info',
          title_ar: 'معلومات ناقصة',
          title_en: 'Missing Information',
          description_ar: `يمكنك إضافة ${missingFields.length} معلومات إضافية لهذا الملف`,
          description_en: `You can add ${missingFields.length} more details to this profile`,
          confidence: 0.9,
          suggestion_data: { missing_fields: missingFields },
        });
      }

      // Check for date inconsistencies
      if (member.birth_date && member.death_date) {
        const birthYear = parseInt((member.birth_date as string).split('-')[0]);
        const deathYear = parseInt((member.death_date as string).split('-')[0]);
        const age = deathYear - birthYear;

        if (age < 0) {
          suggestions.push({
            member_id: member.id as string,
            suggestion_type: 'date_correction',
            title_ar: 'تاريخ غير صحيح',
            title_en: 'Invalid Date',
            description_ar: 'تاريخ الوفاة قبل تاريخ الميلاد',
            description_en: 'Death date is before birth date',
            confidence: 1.0,
            suggestion_data: { birth_date: member.birth_date, death_date: member.death_date },
          });
        } else if (age > 120) {
          suggestions.push({
            member_id: member.id as string,
            suggestion_type: 'date_correction',
            title_ar: 'عمر غير واقعي',
            title_en: 'Unrealistic Age',
            description_ar: `العمر المحسوب ${age} سنة يبدو غير واقعي`,
            description_en: `Calculated age of ${age} years seems unrealistic`,
            confidence: 0.8,
            suggestion_data: { calculated_age: age },
          });
        }
      }

      // Check for orphan members (no parents, no children, no spouse)
      if (!member.father_id && !member.mother_id) {
        const hasChildren = await db.prepare(`
          SELECT COUNT(*) as count FROM family_members
          WHERE tree_id = ? AND (father_id = ? OR mother_id = ?)
        `).bind(treeId, member.id, member.id).first<{ count: number }>();

        const hasSpouse = await db.prepare(`
          SELECT COUNT(*) as count FROM member_spouses WHERE member_id = ? OR spouse_id = ?
        `).bind(member.id, member.id).first<{ count: number }>();

        if ((!hasChildren || hasChildren.count === 0) && (!hasSpouse || hasSpouse.count === 0)) {
          suggestions.push({
            member_id: member.id as string,
            suggestion_type: 'relationship_hint',
            title_ar: 'عضو منفصل',
            title_en: 'Isolated Member',
            description_ar: 'هذا العضو غير مرتبط بأي شخص آخر في الشجرة',
            description_en: 'This member is not connected to anyone else in the tree',
            confidence: 0.7,
            suggestion_data: {},
          });
        }
      }
    }

    // Insert suggestions (ignore duplicates)
    for (const sugg of suggestions) {
      await db.prepare(`
        INSERT INTO ai_suggestions (
          tree_id, member_id, suggestion_type, title_ar, title_en,
          description_ar, description_en, confidence, suggestion_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT DO NOTHING
      `).bind(
        treeId,
        sugg.member_id,
        sugg.suggestion_type,
        sugg.title_ar,
        sugg.title_en,
        sugg.description_ar,
        sugg.description_en,
        sugg.confidence,
        JSON.stringify(sugg.suggestion_data)
      ).run();
    }

    return { success: true, count: suggestions.length };
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return { success: false, count: 0, error: 'Failed to generate suggestions' };
  }
}

/**
 * Get AI suggestions for a tree
 */
export async function getAISuggestions(
  treeId: string,
  options: { status?: 'pending' | 'all'; type?: SuggestionType; limit?: number } = {}
): Promise<AISuggestion[]> {
  try {
    const session = await getSession();
    if (!session?.user) return [];

    const { env } = await getCloudflareContext();
    const db = env.DB;

    let whereClause = 'WHERE s.tree_id = ?';
    const params: unknown[] = [treeId];

    if (options.status === 'pending') {
      whereClause += " AND s.status = 'pending'";
    }

    if (options.type) {
      whereClause += ' AND s.suggestion_type = ?';
      params.push(options.type);
    }

    const limit = options.limit || 50;

    const results = await db.prepare(`
      SELECT s.*,
             m.first_name_ar, m.first_name_en, m.last_name_ar, m.last_name_en,
             m.birth_date, m.death_date, m.gender, m.photo_url
      FROM ai_suggestions s
      LEFT JOIN family_members m ON s.member_id = m.id
      ${whereClause}
      ORDER BY s.confidence DESC, s.created_at DESC
      LIMIT ?
    `).bind(...params, limit).all();

    return (results.results || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      tree_id: row.tree_id as string,
      member_id: row.member_id as string | null,
      suggestion_type: row.suggestion_type as SuggestionType,
      title_ar: row.title_ar as string,
      title_en: row.title_en as string,
      description_ar: row.description_ar as string | null,
      description_en: row.description_en as string | null,
      confidence: row.confidence as number,
      suggestion_data: JSON.parse((row.suggestion_data as string) || '{}'),
      status: row.status as AISuggestion['status'],
      acted_on_by: row.acted_on_by as string | null,
      acted_on_at: row.acted_on_at as number | null,
      expires_at: row.expires_at as number | null,
      created_at: row.created_at as number,
      member: row.member_id ? {
        id: row.member_id as string,
        first_name_ar: row.first_name_ar as string,
        first_name_en: row.first_name_en as string | null,
        last_name_ar: row.last_name_ar as string,
        last_name_en: row.last_name_en as string | null,
        birth_date: row.birth_date as string | null,
        death_date: row.death_date as string | null,
        gender: row.gender as string,
        photo_url: row.photo_url as string | null,
      } : undefined,
    }));
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    return [];
  }
}

/**
 * Dismiss or accept a suggestion
 */
export async function updateSuggestionStatus(
  suggestionId: string,
  status: 'accepted' | 'dismissed'
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    await db.prepare(`
      UPDATE ai_suggestions
      SET status = ?, acted_on_by = ?, acted_on_at = unixepoch()
      WHERE id = ?
    `).bind(status, session.user.id, suggestionId).run();

    return { success: true };
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return { success: false, error: 'Failed to update suggestion' };
  }
}

// =====================================================
// DATA QUALITY
// =====================================================

/**
 * Calculate quality scores for all members in a tree
 */
export async function calculateTreeQuality(
  treeId: string
): Promise<{ success: boolean; metrics?: TreeQualityMetrics; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;

    // Get all members
    const members = await db.prepare(`
      SELECT * FROM family_members WHERE tree_id = ?
    `).bind(treeId).all();

    if (!members.results || members.results.length === 0) {
      return { success: true, metrics: undefined };
    }

    const memberList = members.results as Record<string, unknown>[];
    let totalCompleteness = 0;

    const stats = {
      total: memberList.length,
      withPhoto: 0,
      withBirthDate: 0,
      withBirthPlace: 0,
      withDeathDate: 0,
      withBio: 0,
    };

    // Calculate individual member scores
    for (const member of memberList) {
      const fields = [
        'first_name_ar', 'last_name_ar', 'gender', 'birth_date',
        'birth_place_ar', 'death_date', 'bio_ar', 'photo_url',
        'father_id', 'mother_id'
      ];

      const filledFields = fields.filter(f => member[f] != null && member[f] !== '');
      const completeness = (filledFields.length / fields.length) * 100;

      const missingFields = fields.filter(f => member[f] == null || member[f] === '');
      const issues: string[] = [];

      // Check for issues
      if (member.birth_date && member.death_date) {
        const birthYear = parseInt((member.birth_date as string).split('-')[0]);
        const deathYear = parseInt((member.death_date as string).split('-')[0]);
        if (deathYear < birthYear) {
          issues.push('invalid_dates');
        }
      }

      // Update stats
      if (member.photo_url) stats.withPhoto++;
      if (member.birth_date) stats.withBirthDate++;
      if (member.birth_place_ar) stats.withBirthPlace++;
      if (member.death_date) stats.withDeathDate++;
      if (member.bio_ar || member.bio_en) stats.withBio++;

      totalCompleteness += completeness;

      // Save member quality score
      await db.prepare(`
        INSERT INTO member_quality_scores (
          member_id, tree_id, overall_score, completeness_score,
          accuracy_score, consistency_score, missing_fields, issues,
          last_calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
        ON CONFLICT (member_id) DO UPDATE SET
          overall_score = excluded.overall_score,
          completeness_score = excluded.completeness_score,
          accuracy_score = excluded.accuracy_score,
          consistency_score = excluded.consistency_score,
          missing_fields = excluded.missing_fields,
          issues = excluded.issues,
          last_calculated_at = unixepoch()
      `).bind(
        member.id,
        treeId,
        completeness,
        completeness,
        issues.length === 0 ? 100 : 50,
        100,
        JSON.stringify(missingFields),
        JSON.stringify(issues)
      ).run();
    }

    // Count duplicates and suggestions
    const duplicatesCount = await db.prepare(`
      SELECT COUNT(*) as count FROM duplicate_candidates WHERE tree_id = ? AND status = 'pending'
    `).bind(treeId).first<{ count: number }>();

    const suggestionsCount = await db.prepare(`
      SELECT COUNT(*) as count FROM ai_suggestions WHERE tree_id = ? AND status = 'pending'
    `).bind(treeId).first<{ count: number }>();

    const avgCompleteness = totalCompleteness / stats.total;
    const healthScore = Math.round(
      (avgCompleteness * 0.6) +
      ((stats.withPhoto / stats.total) * 100 * 0.2) +
      ((stats.withBirthDate / stats.total) * 100 * 0.2)
    );

    // Save tree quality metrics
    await db.prepare(`
      INSERT INTO tree_quality_metrics (
        tree_id, total_members, members_with_photos, members_with_birth_date,
        members_with_birth_place, members_with_death_date, members_with_bio,
        average_completeness, duplicate_candidates_count, pending_suggestions_count,
        overall_health_score, last_calculated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
      ON CONFLICT (tree_id) DO UPDATE SET
        total_members = excluded.total_members,
        members_with_photos = excluded.members_with_photos,
        members_with_birth_date = excluded.members_with_birth_date,
        members_with_birth_place = excluded.members_with_birth_place,
        members_with_death_date = excluded.members_with_death_date,
        members_with_bio = excluded.members_with_bio,
        average_completeness = excluded.average_completeness,
        duplicate_candidates_count = excluded.duplicate_candidates_count,
        pending_suggestions_count = excluded.pending_suggestions_count,
        overall_health_score = excluded.overall_health_score,
        last_calculated_at = unixepoch()
    `).bind(
      treeId,
      stats.total,
      stats.withPhoto,
      stats.withBirthDate,
      stats.withBirthPlace,
      stats.withDeathDate,
      stats.withBio,
      avgCompleteness,
      duplicatesCount?.count || 0,
      suggestionsCount?.count || 0,
      healthScore
    ).run();

    return {
      success: true,
      metrics: {
        id: '',
        tree_id: treeId,
        total_members: stats.total,
        members_with_photos: stats.withPhoto,
        members_with_birth_date: stats.withBirthDate,
        members_with_birth_place: stats.withBirthPlace,
        members_with_death_date: stats.withDeathDate,
        members_with_bio: stats.withBio,
        average_completeness: avgCompleteness,
        duplicate_candidates_count: duplicatesCount?.count || 0,
        pending_suggestions_count: suggestionsCount?.count || 0,
        overall_health_score: healthScore,
        last_calculated_at: Date.now() / 1000,
      },
    };
  } catch (error) {
    console.error('Error calculating tree quality:', error);
    return { success: false, error: 'Failed to calculate quality' };
  }
}

/**
 * Get tree quality metrics
 */
export async function getTreeQualityMetrics(
  treeId: string
): Promise<TreeQualityMetrics | null> {
  try {
    const session = await getSession();
    if (!session?.user) return null;

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const result = await db.prepare(`
      SELECT * FROM tree_quality_metrics WHERE tree_id = ?
    `).bind(treeId).first<TreeQualityMetrics>();

    return result || null;
  } catch (error) {
    console.error('Error getting tree quality:', error);
    return null;
  }
}

/**
 * Get members with lowest quality scores
 */
export async function getLowQualityMembers(
  treeId: string,
  limit: number = 10
): Promise<MemberQualityScore[]> {
  try {
    const session = await getSession();
    if (!session?.user) return [];

    const { env } = await getCloudflareContext();
    const db = env.DB;

    const results = await db.prepare(`
      SELECT q.*,
             m.first_name_ar, m.first_name_en, m.last_name_ar, m.last_name_en,
             m.birth_date, m.death_date, m.gender, m.photo_url
      FROM member_quality_scores q
      JOIN family_members m ON q.member_id = m.id
      WHERE q.tree_id = ?
      ORDER BY q.overall_score ASC
      LIMIT ?
    `).bind(treeId, limit).all();

    return (results.results || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      member_id: row.member_id as string,
      tree_id: row.tree_id as string,
      overall_score: row.overall_score as number,
      completeness_score: row.completeness_score as number,
      accuracy_score: row.accuracy_score as number,
      consistency_score: row.consistency_score as number,
      missing_fields: JSON.parse((row.missing_fields as string) || '[]'),
      issues: JSON.parse((row.issues as string) || '[]'),
      last_calculated_at: row.last_calculated_at as number,
      member: {
        id: row.member_id as string,
        first_name_ar: row.first_name_ar as string,
        first_name_en: row.first_name_en as string | null,
        last_name_ar: row.last_name_ar as string,
        last_name_en: row.last_name_en as string | null,
        birth_date: row.birth_date as string | null,
        death_date: row.death_date as string | null,
        gender: row.gender as string,
        photo_url: row.photo_url as string | null,
      },
    }));
  } catch (error) {
    console.error('Error getting low quality members:', error);
    return [];
  }
}

/**
 * Run full smart analysis on a tree
 */
export async function runSmartAnalysis(
  treeId: string
): Promise<{
  success: boolean;
  duplicates: number;
  suggestions: number;
  healthScore: number;
  error?: string
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, duplicates: 0, suggestions: 0, healthScore: 0, error: 'Unauthorized' };
    }

    // Run all analyses
    const [duplicatesResult, suggestionsResult, qualityResult] = await Promise.all([
      scanForDuplicates(treeId),
      generateAISuggestions(treeId),
      calculateTreeQuality(treeId),
    ]);

    return {
      success: true,
      duplicates: duplicatesResult.count,
      suggestions: suggestionsResult.count,
      healthScore: qualityResult.metrics?.overall_health_score || 0,
    };
  } catch (error) {
    console.error('Error running smart analysis:', error);
    return { success: false, duplicates: 0, suggestions: 0, healthScore: 0, error: 'Analysis failed' };
  }
}
