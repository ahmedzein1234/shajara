/**
 * Cloudflare Environment Type Declarations
 * Defines the types for Cloudflare Workers bindings
 */

import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import type { R2Bucket } from '@cloudflare/workers-types';

declare global {
  interface CloudflareEnv {
    // Cloudflare bindings
    DB: D1Database;
    CACHE?: KVNamespace;  // Optional KV namespace for caching
    STORAGE: R2Bucket;
    ASSETS: Fetcher;

    // Environment variables
    ENVIRONMENT: string;
    OPENROUTER_API_KEY?: string;

    // Twilio SMS configuration
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_PHONE_NUMBER?: string;

    // Index signature for other env vars
    [key: string]: unknown;
  }
}

declare module '@opennextjs/cloudflare' {
  export function getCloudflareContext(): Promise<{
    env: CloudflareEnv;
    ctx: ExecutionContext;
  }>;
}

export {};
