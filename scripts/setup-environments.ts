/**
 * Environment Setup Script
 * Creates D1 databases, KV namespaces, and R2 buckets for each environment
 *
 * Usage: npm run env:setup
 *
 * Prerequisites:
 * - Must be logged into wrangler: npx wrangler login
 * - Must have Cloudflare account with necessary permissions
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

const ENVIRONMENTS = ['development', 'staging'] as const;

interface ResourceIds {
  dbId: string;
  cacheKvId: string;
  sessionsKvId: string;
}

function exec(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error: unknown) {
    const execError = error as { stderr?: string; message?: string };
    console.error(`Command failed: ${command}`);
    console.error(execError.stderr || execError.message);
    throw error;
  }
}

function extractId(output: string, pattern: RegExp): string | null {
  const match = output.match(pattern);
  return match ? match[1] : null;
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function setupEnvironment(env: typeof ENVIRONMENTS[number]): Promise<ResourceIds> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Setting up ${env.toUpperCase()} environment`);
  console.log('='.repeat(60));

  const suffix = env === 'development' ? 'dev' : env;

  // Create D1 Database
  console.log(`\n📦 Creating D1 database: shajara-db-${suffix}`);
  let dbId = '';
  try {
    const dbOutput = exec(`npx wrangler d1 create shajara-db-${suffix}`);
    dbId = extractId(dbOutput, /database_id\s*=\s*"([^"]+)"/) || '';
    console.log(`   ✅ Created with ID: ${dbId}`);
  } catch {
    console.log(`   ⚠️ Database may already exist, trying to get ID...`);
    const listOutput = exec('npx wrangler d1 list --json');
    const databases = JSON.parse(listOutput);
    const db = databases.find((d: { name: string }) => d.name === `shajara-db-${suffix}`);
    if (db) {
      dbId = db.uuid;
      console.log(`   ✅ Found existing database with ID: ${dbId}`);
    } else {
      throw new Error(`Could not find or create database shajara-db-${suffix}`);
    }
  }

  // Create CACHE KV namespace
  console.log(`\n📦 Creating KV namespace: shajara-cache-${suffix}`);
  let cacheKvId = '';
  try {
    const kvOutput = exec(`npx wrangler kv namespace create CACHE_${suffix.toUpperCase()}`);
    cacheKvId = extractId(kvOutput, /id\s*=\s*"([^"]+)"/) || '';
    console.log(`   ✅ Created with ID: ${cacheKvId}`);
  } catch {
    console.log(`   ⚠️ KV namespace may already exist`);
    cacheKvId = 'EXISTING_CACHE_KV_ID';
  }

  // Create SESSIONS KV namespace
  console.log(`\n📦 Creating KV namespace: shajara-sessions-${suffix}`);
  let sessionsKvId = '';
  try {
    const kvOutput = exec(`npx wrangler kv namespace create SESSIONS_${suffix.toUpperCase()}`);
    sessionsKvId = extractId(kvOutput, /id\s*=\s*"([^"]+)"/) || '';
    console.log(`   ✅ Created with ID: ${sessionsKvId}`);
  } catch {
    console.log(`   ⚠️ KV namespace may already exist`);
    sessionsKvId = 'EXISTING_SESSIONS_KV_ID';
  }

  // Create R2 buckets
  console.log(`\n📦 Creating R2 bucket: shajara-media-${suffix}`);
  try {
    exec(`npx wrangler r2 bucket create shajara-media-${suffix}`);
    console.log(`   ✅ Created successfully`);
  } catch {
    console.log(`   ⚠️ Bucket may already exist`);
  }

  console.log(`\n📦 Creating R2 bucket: shajara-backups-${suffix}`);
  try {
    exec(`npx wrangler r2 bucket create shajara-backups-${suffix}`);
    console.log(`   ✅ Created successfully`);
  } catch {
    console.log(`   ⚠️ Bucket may already exist`);
  }

  return { dbId, cacheKvId, sessionsKvId };
}

function printWranglerConfig(envResources: Map<string, ResourceIds>) {
  console.log('\n' + '='.repeat(60));
  console.log('WRANGLER.JSON CONFIGURATION');
  console.log('='.repeat(60));
  console.log('\nUpdate your wrangler.json with these IDs:\n');

  for (const [env, resources] of envResources) {
    const suffix = env === 'development' ? 'dev' : env;
    console.log(`Environment: ${env}`);
    console.log('─'.repeat(40));
    console.log(`  D1 Database ID: ${resources.dbId}`);
    console.log(`  Cache KV ID: ${resources.cacheKvId}`);
    console.log(`  Sessions KV ID: ${resources.sessionsKvId}`);
    console.log(`  R2 Buckets: shajara-media-${suffix}, shajara-backups-${suffix}`);
    console.log('');
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       SHAJARA ENVIRONMENT SETUP                            ║');
  console.log('║       Creates Cloudflare resources for all environments    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Check wrangler login
  console.log('\n🔐 Checking wrangler authentication...');
  try {
    exec('npx wrangler whoami');
    console.log('   ✅ Authenticated');
  } catch {
    console.error('❌ Not logged in. Please run: npx wrangler login');
    process.exit(1);
  }

  const proceed = await confirm('\nThis will create D1, KV, and R2 resources. Continue?');
  if (!proceed) {
    console.log('Aborted.');
    process.exit(0);
  }

  const envResources = new Map<string, ResourceIds>();

  for (const env of ENVIRONMENTS) {
    try {
      const resources = await setupEnvironment(env);
      envResources.set(env, resources);
    } catch (error) {
      console.error(`\n❌ Failed to setup ${env} environment:`, error);
    }
  }

  printWranglerConfig(envResources);

  console.log('\n✅ Environment setup complete!');
  console.log('\nNext steps:');
  console.log('1. Update wrangler.json with the IDs above');
  console.log('2. Run migrations: npm run db:migrate:dev && npm run db:migrate:staging');
  console.log('3. Set secrets: npx wrangler secret put OPENROUTER_API_KEY --env development');
  console.log('4. Deploy: npm run deploy:dev');
}

main().catch(console.error);
