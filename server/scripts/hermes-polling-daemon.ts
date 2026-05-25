#!/usr/bin/env tsx
/**
 * Hermes Polling Daemon - Simplified
 * Auto-detects NEW todo + unassigned issues and triggers CTO run
 */

import { setTimeout } from 'timers/promises';

const PAPERCLIP_URL = process.env.PAPERCLIP_URL || 'http://localhost:3100';
const COMPANY_ID = process.env.COMPANY_ID || '84db1d00-c7ff-46a3-98b9-a50a041bd9a5';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '30000'); // 30 seconds

interface Issue {
  id: string;
  identifier: string;
  title: string;
  status: string;
  assignee_id?: string;
}

async function fetchIssues(): Promise<Issue[]> {
  const res = await fetch(`${PAPERCLIP_URL}/api/companies/${COMPANY_ID}/issues`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function triggerCTO(issueId: string): Promise<void> {
  console.log(`[${new Date().toISOString()}] Triggering CTO for issue ${issueId}`);
  
  // Assign CTO
  const assignRes = await fetch(`${PAPERCLIP_URL}/api/issues/${issueId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assigneeAgentId: 'ed6ba1d6-06b6-4c17-a664-71a7db4dcada' })
  });
  
  if (!assignRes.ok) {
    console.error(`Failed to assign: HTTP ${assignRes.status}`);
    return;
  }
  
  // Start run
  const res = await fetch(`${PAPERCLIP_URL}/api/issues/${issueId}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!res.ok) {
    console.error(`Failed to trigger run: HTTP ${res.status}`);
    return;
  }
  
  console.log(`[${new Date().toISOString()}] CTO run started for ${issueId}`);
}

async function poll() {
  try {
    const issues = await fetchIssues();
    
    for (const issue of issues) {
      // ONLY trigger: todo + unassigned
      if (issue.status === 'todo' && !issue.assignee_id) {
        console.log(`Found new issue ${issue.identifier}: ${issue.title}`);
        await triggerCTO(issue.id);
      }
    }
  } catch (err) {
    console.error('Poll error:', err);
  }
}

async function main() {
  console.log('Hermes Polling Daemon started');
  console.log(`Watching: ${PAPERCLIP_URL}/api/companies/${COMPANY_ID}/issues`);
  console.log(`Trigger: todo + unassigned only`);
  console.log(`Interval: ${POLL_INTERVAL}ms`);
  
  while (true) {
    await poll();
    await setTimeout(POLL_INTERVAL);
  }
}

main().catch(console.error);
