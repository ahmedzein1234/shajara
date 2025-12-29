# Incident Response Runbook

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| SEV1 | Complete outage | Immediate | Site down, data breach |
| SEV2 | Major degradation | < 1 hour | Auth failing, DB errors |
| SEV3 | Partial impact | < 4 hours | Slow performance, minor bugs |
| SEV4 | Minimal impact | < 24 hours | UI issues, edge cases |

## Incident Response Process

### 1. Detection

**Automated Alerts**
- Cloudflare Analytics error rate > 1%
- Request latency p95 > 5s
- Worker failures > 10/minute

**Manual Detection**
- User reports
- Internal testing
- Monitoring dashboards

### 2. Triage

```
1. Assess impact scope
   - Number of users affected
   - Which features are broken
   - Data integrity concerns

2. Determine severity level

3. Notify stakeholders (if SEV1/SEV2)
   - Engineering team
   - Product team
   - Support team (for user communication)
```

### 3. Investigation

**Check These First**

1. **Cloudflare Status**
   - https://cloudflarestatus.com
   - Check Pages, Workers, D1, KV, R2

2. **Recent Changes**
   - Last deployment time
   - Recent code changes
   - Configuration changes

3. **Logs**
   - Cloudflare Workers Logs
   - Error messages and stack traces
   - Correlation IDs

4. **Metrics**
   - Error rate trend
   - Latency percentiles
   - Traffic patterns

### 4. Mitigation

**Quick Fixes**

| Issue | Mitigation |
|-------|------------|
| Bad deployment | Rollback to previous |
| API key expired | Rotate and redeploy |
| Database overload | Enable aggressive caching |
| DDoS attack | Enable Cloudflare Under Attack mode |

**Rollback Decision Tree**

```
Is the issue caused by recent deployment?
├── Yes → Rollback deployment
│         └── See DEPLOYMENT.md rollback section
└── No → Continue investigation
         ├── Is it a database issue?
         │   └── Consider restoring from backup
         └── Is it an external dependency?
             └── Enable fallback/degraded mode
```

### 5. Resolution

- Implement permanent fix
- Deploy fix through normal process
- Verify fix in staging first (if time permits)
- Monitor after deployment

### 6. Post-Incident

**Within 24 Hours**
- Write incident summary
- Identify root cause
- Document timeline

**Within 1 Week**
- Complete post-mortem document
- Identify action items
- Schedule follow-up fixes

## Common Incident Playbooks

### Playbook: Site Completely Down

```bash
# 1. Check Cloudflare status
open https://cloudflarestatus.com

# 2. Check deployment status
npx wrangler pages deployment list

# 3. If recent deployment, rollback
# (Use Cloudflare Dashboard)

# 4. If not deployment-related, check D1
npx wrangler d1 execute shajara-db --command "SELECT 1"

# 5. Check Workers logs
# (Cloudflare Dashboard > Workers & Pages > shajara > Logs)
```

### Playbook: Authentication Failing

```bash
# 1. Check session table
npx wrangler d1 execute shajara-db --command "SELECT COUNT(*) FROM sessions WHERE expires_at > datetime('now')"

# 2. Check for database locks
npx wrangler d1 execute shajara-db --command "PRAGMA busy_timeout"

# 3. Verify password hashing is working
# Check for bcrypt errors in logs

# 4. If cookies not setting, check domain config
# Verify CORS and cookie settings in middleware
```

### Playbook: Database Errors

```bash
# 1. Check D1 health
npx wrangler d1 execute shajara-db --command "SELECT 1"

# 2. Check table existence
npx wrangler d1 execute shajara-db --command ".tables"

# 3. Check for pending migrations
ls migrations/

# 4. If data corruption suspected, restore from backup
npm run db:backup -- --list
npm run db:backup -- --restore <backup-key>
```

### Playbook: AI Assistant Not Working

```bash
# 1. Check OpenRouter API status
curl https://openrouter.ai/api/v1/models

# 2. Verify API key is set
npx wrangler secret list

# 3. Check rate limiting
# Review recent AI request counts in logs

# 4. If API key expired, rotate
npx wrangler secret put OPENROUTER_API_KEY
npm run deploy:prod
```

### Playbook: High Latency

```bash
# 1. Check current traffic
# Cloudflare Dashboard > Analytics

# 2. Check D1 query performance
# Enable query logging temporarily

# 3. Check cache hit rate
# Review KV metrics

# 4. Potential quick fixes:
# - Enable more aggressive caching
# - Reduce payload sizes
# - Add indexes to slow queries
```

### Playbook: Data Breach (SEV1)

```
IMMEDIATE ACTIONS:
1. Notify security team
2. Document the breach scope
3. Preserve evidence (logs, access records)

CONTAINMENT:
1. Rotate all API keys and secrets
2. Invalidate all sessions
3. Block suspicious IP addresses
4. Consider taking site offline

NOTIFICATION:
1. Notify affected users (if required)
2. Report to authorities (if required by law)
3. Prepare public statement (if needed)

RECOVERY:
1. Patch vulnerability
2. Restore from clean backup
3. Audit all access logs
4. Implement additional monitoring
```

## Communication Templates

### Internal Notification

```
INCIDENT: [Brief description]
SEVERITY: SEV[1-4]
STATUS: [Investigating/Identified/Monitoring/Resolved]
IMPACT: [Who is affected and how]
CURRENT ACTION: [What we're doing now]
NEXT UPDATE: [Time of next update]
```

### User-Facing Status

```
We are currently experiencing [brief description].
[X] users may be affected.
Our team is actively working on a resolution.
We apologize for any inconvenience.

Last updated: [timestamp]
```

## Post-Mortem Template

```markdown
# Incident Post-Mortem: [Title]

## Summary
[2-3 sentence summary]

## Timeline
- [Time] - Incident detected
- [Time] - Investigation began
- [Time] - Root cause identified
- [Time] - Mitigation applied
- [Time] - Incident resolved

## Root Cause
[Detailed explanation]

## Impact
- Duration: X hours
- Users affected: ~X
- Data impact: [None/Minimal/Significant]

## Resolution
[What was done to fix it]

## Action Items
- [ ] [Action 1] - Owner - Due date
- [ ] [Action 2] - Owner - Due date

## Lessons Learned
[What we learned and how to prevent recurrence]
```
