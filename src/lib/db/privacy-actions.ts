'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSession } from '@/lib/auth/actions';

// =====================================================
// TYPES
// =====================================================

export type VisibilityLevel = 'private' | 'family' | 'public';
export type DateDisplayLevel = 'full' | 'year_only' | 'hidden';
export type PlaceDisplayLevel = 'full' | 'country_only' | 'hidden';
export type TaggingLevel = 'anyone' | 'family' | 'none';

export interface TreePrivacySettings {
  id: string;
  tree_id: string;
  visibility: VisibilityLevel;
  show_living_birth_date: DateDisplayLevel;
  show_living_birth_place: PlaceDisplayLevel;
  show_living_photos: boolean;
  show_living_contact: boolean;
  allow_guest_view: boolean;
  guest_blur_photos: boolean;
  guest_hide_living: boolean;
  allow_gedcom_export: boolean;
  allow_pdf_export: boolean;
  require_approval_for_export: boolean;
  allow_family_contributions: boolean;
  require_approval_for_contributions: boolean;
  created_at: number;
  updated_at: number;
}

export interface PersonPrivacyOverride {
  id: string;
  person_id: string;
  tree_id: string;
  show_birth_date: DateDisplayLevel | null;
  show_birth_place: PlaceDisplayLevel | null;
  show_death_date: DateDisplayLevel | null;
  show_death_place: PlaceDisplayLevel | null;
  show_photo: boolean | null;
  show_in_public_tree: boolean | null;
  allow_tagging: TaggingLevel | null;
  hide_completely: boolean;
  set_by: string | null;
  created_at: number;
  updated_at: number;
}

// =====================================================
// HELPERS
// =====================================================

async function getDB() {
  const { env } = await getCloudflareContext();
  return env.DB;
}

function generateId(): string {
  return 'priv-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// =====================================================
// TREE PRIVACY SETTINGS
// =====================================================

export async function getTreePrivacySettings(treeId: string): Promise<TreePrivacySettings | null> {
  try {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT * FROM tree_privacy_settings WHERE tree_id = ?
    `).bind(treeId).first();

    if (!result) return null;

    return {
      ...result,
      show_living_photos: result.show_living_photos === 1,
      show_living_contact: result.show_living_contact === 1,
      allow_guest_view: result.allow_guest_view === 1,
      guest_blur_photos: result.guest_blur_photos === 1,
      guest_hide_living: result.guest_hide_living === 1,
      allow_gedcom_export: result.allow_gedcom_export === 1,
      allow_pdf_export: result.allow_pdf_export === 1,
      require_approval_for_export: result.require_approval_for_export === 1,
      allow_family_contributions: result.allow_family_contributions === 1,
      require_approval_for_contributions: result.require_approval_for_contributions === 1,
    } as TreePrivacySettings;
  } catch (error) {
    console.error('Get tree privacy settings error:', error);
    return null;
  }
}

export async function updateTreePrivacySettings(
  treeId: string,
  settings: Partial<Omit<TreePrivacySettings, 'id' | 'tree_id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);

    // Check if settings exist
    const existing = await db.prepare(
      'SELECT id FROM tree_privacy_settings WHERE tree_id = ?'
    ).bind(treeId).first();

    if (existing) {
      // Update existing
      const updates: string[] = [];
      const values: (string | number)[] = [];

      if (settings.visibility !== undefined) {
        updates.push('visibility = ?');
        values.push(settings.visibility);
      }
      if (settings.show_living_birth_date !== undefined) {
        updates.push('show_living_birth_date = ?');
        values.push(settings.show_living_birth_date);
      }
      if (settings.show_living_birth_place !== undefined) {
        updates.push('show_living_birth_place = ?');
        values.push(settings.show_living_birth_place);
      }
      if (settings.show_living_photos !== undefined) {
        updates.push('show_living_photos = ?');
        values.push(settings.show_living_photos ? 1 : 0);
      }
      if (settings.show_living_contact !== undefined) {
        updates.push('show_living_contact = ?');
        values.push(settings.show_living_contact ? 1 : 0);
      }
      if (settings.allow_guest_view !== undefined) {
        updates.push('allow_guest_view = ?');
        values.push(settings.allow_guest_view ? 1 : 0);
      }
      if (settings.guest_blur_photos !== undefined) {
        updates.push('guest_blur_photos = ?');
        values.push(settings.guest_blur_photos ? 1 : 0);
      }
      if (settings.guest_hide_living !== undefined) {
        updates.push('guest_hide_living = ?');
        values.push(settings.guest_hide_living ? 1 : 0);
      }
      if (settings.allow_gedcom_export !== undefined) {
        updates.push('allow_gedcom_export = ?');
        values.push(settings.allow_gedcom_export ? 1 : 0);
      }
      if (settings.allow_pdf_export !== undefined) {
        updates.push('allow_pdf_export = ?');
        values.push(settings.allow_pdf_export ? 1 : 0);
      }
      if (settings.require_approval_for_export !== undefined) {
        updates.push('require_approval_for_export = ?');
        values.push(settings.require_approval_for_export ? 1 : 0);
      }
      if (settings.allow_family_contributions !== undefined) {
        updates.push('allow_family_contributions = ?');
        values.push(settings.allow_family_contributions ? 1 : 0);
      }
      if (settings.require_approval_for_contributions !== undefined) {
        updates.push('require_approval_for_contributions = ?');
        values.push(settings.require_approval_for_contributions ? 1 : 0);
      }

      if (updates.length > 0) {
        updates.push('updated_at = ?');
        values.push(now);
        values.push(treeId);

        await db.prepare(`
          UPDATE tree_privacy_settings SET ${updates.join(', ')} WHERE tree_id = ?
        `).bind(...values).run();
      }
    } else {
      // Create new
      const id = generateId();
      await db.prepare(`
        INSERT INTO tree_privacy_settings (
          id, tree_id, visibility, show_living_birth_date, show_living_birth_place,
          show_living_photos, show_living_contact, allow_guest_view, guest_blur_photos,
          guest_hide_living, allow_gedcom_export, allow_pdf_export,
          require_approval_for_export, allow_family_contributions,
          require_approval_for_contributions, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        treeId,
        settings.visibility || 'private',
        settings.show_living_birth_date || 'year_only',
        settings.show_living_birth_place || 'country_only',
        settings.show_living_photos !== false ? 1 : 0,
        settings.show_living_contact ? 1 : 0,
        settings.allow_guest_view ? 1 : 0,
        settings.guest_blur_photos !== false ? 1 : 0,
        settings.guest_hide_living !== false ? 1 : 0,
        settings.allow_gedcom_export !== false ? 1 : 0,
        settings.allow_pdf_export !== false ? 1 : 0,
        settings.require_approval_for_export ? 1 : 0,
        settings.allow_family_contributions !== false ? 1 : 0,
        settings.require_approval_for_contributions !== false ? 1 : 0,
        now,
        now
      ).run();
    }

    return { success: true };
  } catch (error) {
    console.error('Update tree privacy settings error:', error);
    return { success: false, error: 'Failed to update privacy settings' };
  }
}

// =====================================================
// PERSON PRIVACY OVERRIDES
// =====================================================

export async function getPersonPrivacyOverride(personId: string): Promise<PersonPrivacyOverride | null> {
  try {
    const db = await getDB();
    const result = await db.prepare(`
      SELECT * FROM person_privacy_overrides WHERE person_id = ?
    `).bind(personId).first();

    if (!result) return null;

    return {
      ...result,
      show_photo: result.show_photo === null ? null : result.show_photo === 1,
      show_in_public_tree: result.show_in_public_tree === null ? null : result.show_in_public_tree === 1,
      hide_completely: result.hide_completely === 1,
    } as PersonPrivacyOverride;
  } catch (error) {
    console.error('Get person privacy override error:', error);
    return null;
  }
}

export async function setPersonPrivacyOverride(
  personId: string,
  treeId: string,
  overrides: Partial<Omit<PersonPrivacyOverride, 'id' | 'person_id' | 'tree_id' | 'set_by' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    const now = Math.floor(Date.now() / 1000);

    // Check if override exists
    const existing = await db.prepare(
      'SELECT id FROM person_privacy_overrides WHERE person_id = ?'
    ).bind(personId).first();

    if (existing) {
      // Update existing
      const updates: string[] = [];
      const values: (string | number | null)[] = [];

      if (overrides.show_birth_date !== undefined) {
        updates.push('show_birth_date = ?');
        values.push(overrides.show_birth_date);
      }
      if (overrides.show_birth_place !== undefined) {
        updates.push('show_birth_place = ?');
        values.push(overrides.show_birth_place);
      }
      if (overrides.show_death_date !== undefined) {
        updates.push('show_death_date = ?');
        values.push(overrides.show_death_date);
      }
      if (overrides.show_death_place !== undefined) {
        updates.push('show_death_place = ?');
        values.push(overrides.show_death_place);
      }
      if (overrides.show_photo !== undefined) {
        updates.push('show_photo = ?');
        values.push(overrides.show_photo === null ? null : overrides.show_photo ? 1 : 0);
      }
      if (overrides.show_in_public_tree !== undefined) {
        updates.push('show_in_public_tree = ?');
        values.push(overrides.show_in_public_tree === null ? null : overrides.show_in_public_tree ? 1 : 0);
      }
      if (overrides.allow_tagging !== undefined) {
        updates.push('allow_tagging = ?');
        values.push(overrides.allow_tagging);
      }
      if (overrides.hide_completely !== undefined) {
        updates.push('hide_completely = ?');
        values.push(overrides.hide_completely ? 1 : 0);
      }

      if (updates.length > 0) {
        updates.push('set_by = ?');
        values.push(session.user.id);
        updates.push('updated_at = ?');
        values.push(now);
        values.push(personId);

        await db.prepare(`
          UPDATE person_privacy_overrides SET ${updates.join(', ')} WHERE person_id = ?
        `).bind(...values).run();
      }
    } else {
      // Create new
      const id = generateId();
      await db.prepare(`
        INSERT INTO person_privacy_overrides (
          id, person_id, tree_id, show_birth_date, show_birth_place,
          show_death_date, show_death_place, show_photo, show_in_public_tree,
          allow_tagging, hide_completely, set_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        personId,
        treeId,
        overrides.show_birth_date || null,
        overrides.show_birth_place || null,
        overrides.show_death_date || null,
        overrides.show_death_place || null,
        overrides.show_photo === null ? null : overrides.show_photo ? 1 : 0,
        overrides.show_in_public_tree === null ? null : overrides.show_in_public_tree ? 1 : 0,
        overrides.allow_tagging || null,
        overrides.hide_completely ? 1 : 0,
        session.user.id,
        now,
        now
      ).run();
    }

    return { success: true };
  } catch (error) {
    console.error('Set person privacy override error:', error);
    return { success: false, error: 'Failed to set privacy override' };
  }
}

export async function removePersonPrivacyOverride(personId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const db = await getDB();
    await db.prepare(
      'DELETE FROM person_privacy_overrides WHERE person_id = ?'
    ).bind(personId).run();

    return { success: true };
  } catch (error) {
    console.error('Remove person privacy override error:', error);
    return { success: false, error: 'Failed to remove privacy override' };
  }
}
