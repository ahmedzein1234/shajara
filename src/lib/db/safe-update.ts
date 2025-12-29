/**
 * Safe SQL Update Helper
 * Validates column names against allowlists to prevent SQL injection
 * through dynamic column names in UPDATE statements
 */

// Allowlists for valid column names by table
const ALLOWED_COLUMNS: Record<string, Set<string>> = {
  persons: new Set([
    'given_name', 'patronymic_chain', 'family_name',
    'full_name_ar', 'full_name_en', 'gender',
    'birth_date', 'birth_place', 'birth_place_lat', 'birth_place_lng',
    'death_date', 'death_place', 'death_place_lat', 'death_place_lng',
    'is_living', 'photo_url', 'notes', 'updated_at'
  ]),
  trees: new Set([
    'name', 'description', 'is_public', 'updated_at'
  ]),
  relationships: new Set([
    'relationship_type', 'marriage_date', 'marriage_place',
    'divorce_date', 'divorce_place'
  ]),
  tree_privacy_settings: new Set([
    'default_visibility', 'show_living_members_to_public',
    'show_photos_to_public', 'show_dates_to_public',
    'show_locations_to_public', 'allow_discovery',
    'require_approval_for_connections', 'living_members_visibility',
    'deceased_members_visibility', 'updated_at'
  ]),
  family_connections: new Set([
    'access_level', 'linked_person_id', 'relationship_type',
    'is_verified', 'verified_by_user_id', 'verified_at', 'updated_at'
  ]),
  user_privacy_preferences: new Set([
    'allow_family_search', 'show_in_member_directory',
    'default_tree_visibility', 'notify_on_connection_request',
    'notify_on_profile_view', 'notify_on_tree_update', 'updated_at'
  ]),
};

export interface SafeUpdateResult {
  setParts: string[];
  values: (string | number | null)[];
}

/**
 * Build safe UPDATE SET clause from an object
 * Only includes keys that are in the allowlist for the given table
 *
 * @param table - The table name to validate against
 * @param data - Object containing column-value pairs
 * @returns Object with setParts array and values array, or null if no valid updates
 */
export function buildSafeUpdate(
  table: string,
  data: Record<string, unknown>
): SafeUpdateResult | null {
  const allowedColumns = ALLOWED_COLUMNS[table];

  if (!allowedColumns) {
    throw new Error(`Unknown table: ${table}`);
  }

  const setParts: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values and 'id' field
    if (value === undefined || key === 'id') {
      continue;
    }

    // Validate column name is in allowlist
    if (!allowedColumns.has(key)) {
      console.warn(`Ignoring invalid column "${key}" for table "${table}"`);
      continue;
    }

    // Validate column name format (alphanumeric and underscore only)
    if (!/^[a-z_][a-z0-9_]*$/i.test(key)) {
      throw new Error(`Invalid column name format: ${key}`);
    }

    setParts.push(`${key} = ?`);
    values.push(value as string | number | null);
  }

  if (setParts.length === 0) {
    return null;
  }

  return { setParts, values };
}

/**
 * Validate that a column name is safe for SQL
 * @param column - Column name to validate
 * @param table - Table name for allowlist lookup
 * @returns true if valid
 * @throws Error if invalid
 */
export function validateColumn(column: string, table: string): boolean {
  const allowedColumns = ALLOWED_COLUMNS[table];

  if (!allowedColumns) {
    throw new Error(`Unknown table: ${table}`);
  }

  if (!allowedColumns.has(column)) {
    throw new Error(`Invalid column "${column}" for table "${table}"`);
  }

  return true;
}

/**
 * Get list of allowed columns for a table
 * @param table - Table name
 * @returns Array of allowed column names
 */
export function getAllowedColumns(table: string): string[] {
  const columns = ALLOWED_COLUMNS[table];
  if (!columns) {
    throw new Error(`Unknown table: ${table}`);
  }
  return Array.from(columns);
}
