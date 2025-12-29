# Deployment Runbook

## Pre-Deployment Checklist

- [ ] All tests passing (`npm run test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No lint errors (`npm run lint`)
- [ ] Database migrations prepared (if any)
- [ ] Environment variables updated (if any)
- [ ] CHANGELOG updated
- [ ] Version bumped in package.json

## Deployment Procedures

### Standard Deployment to Production

```bash
# 1. Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# 2. Run full test suite
npm run test:run
npm run test:e2e

# 3. Deploy to staging first
npm run deploy:staging

# 4. Verify staging deployment
# - Visit https://shajara-staging.pages.dev
# - Test critical flows
# - Check logs for errors

# 5. Deploy to production
npm run deploy:prod

# 6. Verify production deployment
# - Visit https://shajara.pages.dev
# - Test critical flows
# - Monitor error rates
```

### Deploying Database Migrations

```bash
# 1. Review migration file
cat migrations/0XXX_your_migration.sql

# 2. Backup production database FIRST
npm run db:backup

# 3. Apply to staging
npm run db:migrate:staging

# 4. Test on staging

# 5. Apply to production
npm run db:migrate:prod

# 6. Verify data integrity
```

### Hotfix Deployment

```bash
# 1. Create hotfix branch
git checkout -b hotfix/issue-description main

# 2. Make minimal fix
# ... edit files ...

# 3. Test locally
npm run test
npm run build

# 4. Deploy directly to production (emergency only)
npm run deploy:prod

# 5. Create PR to merge back to main
git push origin hotfix/issue-description
# Create PR on GitHub

# 6. Monitor for 30 minutes
```

## Rollback Procedures

### Rolling Back Cloudflare Pages Deployment

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Pages > shajara
3. Go to "Deployments" tab
4. Find the previous working deployment
5. Click "..." menu > "Rollback to this deployment"
6. Confirm rollback

### Rolling Back Database Changes

**WARNING**: Database rollbacks can cause data loss. Always backup first.

```bash
# 1. Identify the backup to restore
npm run db:backup -- --list

# 2. Restore from backup (DESTRUCTIVE)
npm run db:backup -- --restore daily/backup-production-YYYY-MM-DD.sql.gz

# 3. Verify data integrity
# Run critical queries to ensure data is correct
```

## Environment-Specific Notes

### Development

- Uses local D1 database
- Hot reload enabled
- Debug logging enabled
- No rate limiting

### Staging

- Mirrors production configuration
- Uses separate D1 database
- Test data only
- Can be used for load testing

### Production

- Full security headers enabled
- Rate limiting active
- Error tracking enabled
- Backups run daily

## Deployment Verification

### Smoke Tests

After each deployment, verify:

1. **Homepage loads** - Visit `/ar` and `/en`
2. **Authentication works** - Login/logout flow
3. **Tree creation** - Create a new tree
4. **Person addition** - Add a person to tree
5. **AI Assistant** - Test natural language input
6. **Search** - Search for a person

### Health Check Endpoints

```bash
# Check API health
curl https://shajara.pages.dev/api/health

# Expected response
{"status": "ok", "timestamp": "..."}
```

## Secrets Management

### Setting Secrets

```bash
# Production
npx wrangler secret put OPENROUTER_API_KEY

# Staging
npx wrangler secret put OPENROUTER_API_KEY --env staging
```

### Listing Secrets

```bash
npx wrangler secret list
```

### Rotating Secrets

1. Generate new secret value
2. Set new secret: `npx wrangler secret put SECRET_NAME`
3. Deploy to activate
4. Revoke old secret value

## Troubleshooting

### Deployment Fails

**Symptoms**: `wrangler deploy` exits with error

**Resolution**:
1. Check Cloudflare status: https://cloudflarestatus.com
2. Verify wrangler login: `npx wrangler whoami`
3. Clear build cache: `rm -rf .next .open-next`
4. Retry deployment

### Workers Failing

**Symptoms**: 500 errors, timeout errors

**Resolution**:
1. Check Workers Logs in Cloudflare Dashboard
2. Look for unhandled exceptions
3. Check D1 database connectivity
4. Verify environment variables

### Database Errors

**Symptoms**: D1_ERROR, query timeouts

**Resolution**:
1. Check D1 database status in Cloudflare Dashboard
2. Review recent migrations
3. Check for locked tables
4. Consider scaling (contact Cloudflare support)

## Monitoring After Deployment

### First 30 Minutes

- Watch error rate in Cloudflare Analytics
- Monitor Workers Logs for exceptions
- Check request latency metrics
- Verify scheduled jobs running (if applicable)

### First 24 Hours

- Review user feedback channels
- Check for unusual patterns
- Verify backup completed successfully
- Review performance metrics

## Emergency Contacts

- **Cloudflare Support**: support@cloudflare.com
- **On-Call Engineer**: (internal)
- **Product Owner**: (internal)
