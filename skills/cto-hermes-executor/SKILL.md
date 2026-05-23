# CTO Hermes Executor

## Purpose
Enable the CTO agent to delegate code execution, file modifications, and builds to Hermes (the executor AI) via a direct API call. This is the **Two Friends Model** in action: Paperclip plans, Hermes executes.

## When to Delegate to Hermes

| Task | Delegate to Hermes? |
|------|---------------------|
| Read/write files on disk | **Yes** |
| Run terminal commands / builds | **Yes** |
| Browser automation / screenshots | **Yes** |
| Web search / data extraction | **Yes** |
| Create/modify database schema | **Yes** |
| Plan architecture / create issues | **No** — Paperclip handles this |
| Assign tasks to other agents | **No** — Paperclip handles this |
| Review & approve deliverables | **No** — Human handles this |

## How to Call Hermes

### Endpoint
```
POST {HERMES_API_URL}/api/hermes/execute
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {HERMES_API_KEY}
```

### Payload
```json
{
  "task": "Build the project and verify with screenshot: npm run build",
  "session_id": "optional-session-id",
  "toolsets": ["terminal", "file", "browser"],
  "max_iterations": 30,
  "model": "anthropic/claude-sonnet-4"
}
```

### Response
```json
{
  "success": true,
  "session_id": "abc123",
  "result": "Build succeeded. Screenshot saved at /tmp/verify.png"
}
```

## Workflow

1. **CTO reads issue** → Understands what needs to be built/fixed
2. **CTO decides execution needed** → Check table above
3. **CTO calls Hermes API** with clear, detailed task description
4. **Hermes executes** → Returns result + any artifacts
5. **CTO reviews result** → If success, marks issue complete. If failure, retries or escalates.

## Safety Controls

- Always include `--dry-run` flag in task description when testing destructive operations
- Hermes runs with the same permissions as the OS user — respect file boundaries
- Never pass secrets in the `task` string; use environment variables
- Set `max_iterations` ≤ 30 for normal tasks, ≤ 90 for complex builds

## Environment Variables (set in Paperclip `.env`)

| Variable | Purpose |
|----------|---------|
| `HERMES_API_URL` | URL of Hermes API server (e.g., `http://localhost:8080`) |
| `HERMES_API_KEY` | Shared secret for Bearer auth |

## Example

```bash
curl -X POST "$HERMES_API_URL/api/hermes/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HERMES_API_KEY" \
  -d '{
    "task": "Import agents from https://github.com/msitarzewski/agency-agents into Paperclip DB. Use ./bin/import-agents script.",
    "toolsets": ["terminal", "file"],
    "max_iterations": 20
  }'
```
