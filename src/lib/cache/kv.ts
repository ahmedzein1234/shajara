/**
 * KV Caching Layer for Shajara
 * Provides caching utilities using Cloudflare KV
 */

import type { KVNamespace } from '@cloudflare/workers-types';
import type { Tree, Person, Relationship } from '@/lib/db/schema';

// Cache TTL in seconds
export const CACHE_TTL = {
  TREE: 300,           // 5 minutes for tree data
  TREE_LIST: 120,      // 2 minutes for tree lists
  PERSON: 300,         // 5 minutes for person data
  SEARCH: 60,          // 1 minute for search results
} as const;

// Cache key prefixes
const CACHE_KEYS = {
  TREE: 'tree:',
  TREE_LIST: 'trees:user:',
  PERSON: 'person:',
  SEARCH: 'search:',
} as const;

/**
 * Serializable tree data structure for caching
 * Maps are converted to objects for JSON serialization
 */
export interface CachedTreeData {
  tree: Tree;
  persons: Person[];
  relationships: Relationship[];
  relationshipMaps: {
    parents: Record<string, string[]>;
    children: Record<string, string[]>;
    spouses: Record<string, string[]>;
  };
  cachedAt: number;
}

/**
 * Get cached tree data from KV
 */
export async function getCachedTree(
  kv: KVNamespace | undefined,
  treeId: string
): Promise<CachedTreeData | null> {
  if (!kv) return null;

  try {
    const key = `${CACHE_KEYS.TREE}${treeId}`;
    const cached = await kv.get(key, 'json');
    return cached as CachedTreeData | null;
  } catch (error) {
    console.error('KV cache get error:', error);
    return null;
  }
}

/**
 * Set tree data in KV cache
 */
export async function setCachedTree(
  kv: KVNamespace | undefined,
  treeId: string,
  data: Omit<CachedTreeData, 'cachedAt'>
): Promise<void> {
  if (!kv) return;

  try {
    const key = `${CACHE_KEYS.TREE}${treeId}`;
    const cacheData: CachedTreeData = {
      ...data,
      cachedAt: Date.now(),
    };
    await kv.put(key, JSON.stringify(cacheData), {
      expirationTtl: CACHE_TTL.TREE,
    });
  } catch (error) {
    console.error('KV cache set error:', error);
  }
}

/**
 * Invalidate tree cache when tree is modified
 */
export async function invalidateTreeCache(
  kv: KVNamespace | undefined,
  treeId: string
): Promise<void> {
  if (!kv) return;

  try {
    const key = `${CACHE_KEYS.TREE}${treeId}`;
    await kv.delete(key);
  } catch (error) {
    console.error('KV cache invalidate error:', error);
  }
}

/**
 * Get cached tree list for a user
 */
export async function getCachedTreeList(
  kv: KVNamespace | undefined,
  userId: string
): Promise<Tree[] | null> {
  if (!kv) return null;

  try {
    const key = `${CACHE_KEYS.TREE_LIST}${userId}`;
    const cached = await kv.get(key, 'json');
    return cached as Tree[] | null;
  } catch (error) {
    console.error('KV cache get error:', error);
    return null;
  }
}

/**
 * Set tree list in KV cache
 */
export async function setCachedTreeList(
  kv: KVNamespace | undefined,
  userId: string,
  trees: Tree[]
): Promise<void> {
  if (!kv) return;

  try {
    const key = `${CACHE_KEYS.TREE_LIST}${userId}`;
    await kv.put(key, JSON.stringify(trees), {
      expirationTtl: CACHE_TTL.TREE_LIST,
    });
  } catch (error) {
    console.error('KV cache set error:', error);
  }
}

/**
 * Invalidate tree list cache for a user
 */
export async function invalidateTreeListCache(
  kv: KVNamespace | undefined,
  userId: string
): Promise<void> {
  if (!kv) return;

  try {
    const key = `${CACHE_KEYS.TREE_LIST}${userId}`;
    await kv.delete(key);
  } catch (error) {
    console.error('KV cache invalidate error:', error);
  }
}

/**
 * Get cached person data
 */
export async function getCachedPerson(
  kv: KVNamespace | undefined,
  personId: string
): Promise<Person | null> {
  if (!kv) return null;

  try {
    const key = `${CACHE_KEYS.PERSON}${personId}`;
    const cached = await kv.get(key, 'json');
    return cached as Person | null;
  } catch (error) {
    console.error('KV cache get error:', error);
    return null;
  }
}

/**
 * Set person data in KV cache
 */
export async function setCachedPerson(
  kv: KVNamespace | undefined,
  personId: string,
  person: Person
): Promise<void> {
  if (!kv) return;

  try {
    const key = `${CACHE_KEYS.PERSON}${personId}`;
    await kv.put(key, JSON.stringify(person), {
      expirationTtl: CACHE_TTL.PERSON,
    });
  } catch (error) {
    console.error('KV cache set error:', error);
  }
}

/**
 * Invalidate person cache
 */
export async function invalidatePersonCache(
  kv: KVNamespace | undefined,
  personId: string
): Promise<void> {
  if (!kv) return;

  try {
    const key = `${CACHE_KEYS.PERSON}${personId}`;
    await kv.delete(key);
  } catch (error) {
    console.error('KV cache invalidate error:', error);
  }
}

/**
 * Invalidate multiple caches when a person is updated
 * (person cache + tree cache for that tree)
 */
export async function invalidatePersonAndTreeCache(
  kv: KVNamespace | undefined,
  personId: string,
  treeId: string
): Promise<void> {
  if (!kv) return;

  await Promise.all([
    invalidatePersonCache(kv, personId),
    invalidateTreeCache(kv, treeId),
  ]);
}

/**
 * Helper to get KV from request context
 */
export function getKVFromEnv(env: unknown): KVNamespace | undefined {
  if (env && typeof env === 'object' && 'CACHE' in env) {
    return (env as { CACHE: KVNamespace }).CACHE;
  }
  return undefined;
}
