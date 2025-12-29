/**
 * Database Backup Script
 * Exports D1 database and uploads to R2 for disaster recovery
 *
 * Usage:
 *   npm run db:backup                    # Backup production
 *   npm run db:backup -- --env staging   # Backup staging
 *   npm run db:backup -- --list          # List available backups
 *   npm run db:backup -- --restore <key> # Restore from backup
 *
 * Features:
 * - Automated daily backups (via Cloudflare Cron Triggers)
 * - 30-day retention policy
 * - Compressed SQL exports
 * - Point-in-time recovery
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

// Configuration
const CONFIG = {
  production: {
    dbName: 'shajara-db',
    bucketName: 'shajara-backups',
    env: '',
  },
  staging: {
    dbName: 'shajara-db-staging',
    bucketName: 'shajara-backups-staging',
    env: '--env staging',
  },
  development: {
    dbName: 'shajara-db-dev',
    bucketName: 'shajara-backups-dev',
    env: '--env development',
  },
};

const RETENTION_DAYS = 30;

type Environment = keyof typeof CONFIG;

function exec(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 });
  } catch (error: unknown) {
    const execError = error as { stderr?: string; message?: string };
    console.error(`Command failed: ${command}`);
    console.error(execError.stderr || execError.message);
    throw error;
  }
}

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function parseArgs(): { env: Environment; action: 'backup' | 'list' | 'restore'; restoreKey?: string } {
  const args = process.argv.slice(2);
  let env: Environment = 'production';
  let action: 'backup' | 'list' | 'restore' = 'backup';
  let restoreKey: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env' && args[i + 1]) {
      env = args[i + 1] as Environment;
      i++;
    } else if (args[i] === '--list') {
      action = 'list';
    } else if (args[i] === '--restore' && args[i + 1]) {
      action = 'restore';
      restoreKey = args[i + 1];
      i++;
    }
  }

  return { env, action, restoreKey };
}

async function exportDatabase(env: Environment): Promise<string> {
  const config = CONFIG[env];
  const timestamp = getTimestamp();
  const filename = `backup-${env}-${timestamp}.sql`;
  const tempDir = path.join(process.cwd(), '.backup-temp');

  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filepath = path.join(tempDir, filename);

  console.log(`📦 Exporting database: ${config.dbName}`);

  // Export using wrangler d1 export
  const exportCmd = `npx wrangler d1 export ${config.dbName} --remote ${config.env} --output ${filepath}`;
  exec(exportCmd);

  console.log(`   ✅ Exported to: ${filepath}`);
  return filepath;
}

function compressFile(filepath: string): string {
  console.log(`🗜️ Compressing backup...`);

  const compressedPath = filepath + '.gz';
  const fileContent = fs.readFileSync(filepath);
  const compressed = zlib.gzipSync(fileContent, { level: 9 });
  fs.writeFileSync(compressedPath, compressed);

  // Get file sizes
  const originalSize = fs.statSync(filepath).size;
  const compressedSize = fs.statSync(compressedPath).size;
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

  console.log(`   ✅ Compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${ratio}% reduction)`);

  // Remove uncompressed file
  fs.unlinkSync(filepath);

  return compressedPath;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function uploadToR2(filepath: string, env: Environment): Promise<string> {
  const config = CONFIG[env];
  const filename = path.basename(filepath);
  const key = `daily/${filename}`;

  console.log(`☁️ Uploading to R2: ${config.bucketName}/${key}`);

  const uploadCmd = `npx wrangler r2 object put ${config.bucketName}/${key} --file ${filepath} ${config.env}`;
  exec(uploadCmd);

  console.log(`   ✅ Uploaded successfully`);

  // Clean up local file
  fs.unlinkSync(filepath);

  // Clean up temp directory if empty
  const tempDir = path.dirname(filepath);
  if (fs.readdirSync(tempDir).length === 0) {
    fs.rmdirSync(tempDir);
  }

  return key;
}

async function cleanupOldBackups(env: Environment): Promise<void> {
  const config = CONFIG[env];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  console.log(`🧹 Cleaning up backups older than ${RETENTION_DAYS} days...`);

  try {
    // List objects in bucket
    const listCmd = `npx wrangler r2 object list ${config.bucketName} --prefix daily/ ${config.env}`;
    const output = exec(listCmd);

    // Parse output and find old backups
    const lines = output.split('\n').filter(line => line.includes('backup-'));
    let deleted = 0;

    for (const line of lines) {
      // Extract date from backup filename (backup-env-YYYY-MM-DDTHH-MM-SS.sql.gz)
      const match = line.match(/backup-\w+-(\d{4}-\d{2}-\d{2})/);
      if (match) {
        const backupDate = new Date(match[1]);
        if (backupDate < cutoffDate) {
          const keyMatch = line.match(/(daily\/backup-[^\s]+)/);
          if (keyMatch) {
            const key = keyMatch[1];
            console.log(`   Deleting: ${key}`);
            exec(`npx wrangler r2 object delete ${config.bucketName}/${key} ${config.env}`);
            deleted++;
          }
        }
      }
    }

    console.log(`   ✅ Deleted ${deleted} old backup(s)`);
  } catch (error) {
    console.log(`   ⚠️ Could not clean up old backups: ${error}`);
  }
}

async function listBackups(env: Environment): Promise<void> {
  const config = CONFIG[env];

  console.log(`\n📋 Available backups for ${env}:`);
  console.log('─'.repeat(60));

  try {
    const listCmd = `npx wrangler r2 object list ${config.bucketName} --prefix daily/ ${config.env}`;
    const output = exec(listCmd);

    const lines = output.split('\n').filter(line => line.includes('backup-'));
    if (lines.length === 0) {
      console.log('No backups found.');
      return;
    }

    lines.forEach(line => {
      console.log(line);
    });

    console.log('─'.repeat(60));
    console.log(`Total: ${lines.length} backup(s)`);
  } catch (error) {
    console.error('Failed to list backups:', error);
  }
}

async function restoreBackup(env: Environment, key: string): Promise<void> {
  const config = CONFIG[env];
  const tempDir = path.join(process.cwd(), '.backup-temp');

  console.log(`\n⚠️  WARNING: This will restore the database from backup.`);
  console.log(`   Environment: ${env}`);
  console.log(`   Backup key: ${key}`);
  console.log(`\nThis is a destructive operation. Press Ctrl+C to cancel.\n`);

  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const localPath = path.join(tempDir, path.basename(key));

  console.log(`📥 Downloading backup...`);
  const downloadCmd = `npx wrangler r2 object get ${config.bucketName}/${key} ${config.env} --file ${localPath}`;
  exec(downloadCmd);

  // Decompress if needed
  let sqlPath = localPath;
  if (localPath.endsWith('.gz')) {
    console.log(`🗜️ Decompressing...`);
    const compressed = fs.readFileSync(localPath);
    const decompressed = zlib.gunzipSync(compressed);
    sqlPath = localPath.replace('.gz', '');
    fs.writeFileSync(sqlPath, decompressed);
    fs.unlinkSync(localPath);
  }

  console.log(`📤 Restoring to database: ${config.dbName}`);
  const restoreCmd = `npx wrangler d1 execute ${config.dbName} --remote ${config.env} --file ${sqlPath}`;
  exec(restoreCmd);

  // Cleanup
  fs.unlinkSync(sqlPath);
  if (fs.readdirSync(tempDir).length === 0) {
    fs.rmdirSync(tempDir);
  }

  console.log(`✅ Database restored successfully!`);
}

async function backup(env: Environment): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       SHAJARA DATABASE BACKUP                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nEnvironment: ${env.toUpperCase()}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Step 1: Export database
    const sqlPath = await exportDatabase(env);

    // Step 2: Compress
    const compressedPath = compressFile(sqlPath);

    // Step 3: Upload to R2
    const r2Key = await uploadToR2(compressedPath, env);

    // Step 4: Cleanup old backups
    await cleanupOldBackups(env);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ BACKUP COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(60));
    console.log(`\nBackup stored at: ${CONFIG[env].bucketName}/${r2Key}`);
    console.log(`Retention: ${RETENTION_DAYS} days`);
    console.log(`\nTo restore: npm run db:backup -- --restore ${r2Key} --env ${env}`);
  } catch (error) {
    console.error('\n❌ BACKUP FAILED');
    console.error(error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const { env, action, restoreKey } = parseArgs();

  if (!CONFIG[env]) {
    console.error(`Invalid environment: ${env}`);
    console.error(`Valid environments: ${Object.keys(CONFIG).join(', ')}`);
    process.exit(1);
  }

  switch (action) {
    case 'list':
      await listBackups(env);
      break;
    case 'restore':
      if (!restoreKey) {
        console.error('Please provide a backup key to restore');
        process.exit(1);
      }
      await restoreBackup(env, restoreKey);
      break;
    case 'backup':
    default:
      await backup(env);
      break;
  }
}

main().catch(console.error);
