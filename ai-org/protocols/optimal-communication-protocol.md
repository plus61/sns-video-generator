# AI Organization Optimal Communication Protocol

## Protocol Design Principles
- Machine-readable structured data
- Minimal latency
- Clear action directives
- State tracking
- Error handling

## Message Format

### Standard Message Structure
```json
{
  "msg_id": "uuid",
  "timestamp": "ISO8601",
  "from": "president|boss1|worker[1-3]",
  "to": "president|boss1|worker[1-3]|all",
  "type": "directive|status|result|error|query",
  "priority": 1-5,
  "payload": {},
  "requires_ack": true,
  "timeout_ms": 5000
}
```

### Message Types

#### 1. DIRECTIVE (President → Boss)
```json
{
  "type": "directive",
  "payload": {
    "action": "EMERGENCY_FIX",
    "targets": {
      "success_rate": 80,
      "deadline": "2025-06-20T12:30:00Z",
      "critical_issues": ["railway_404", "api_missing"]
    },
    "resources": ["all_workers"],
    "constraints": {
      "max_time": 1800,
      "rollback_enabled": true
    }
  }
}
```

#### 2. TASK_ASSIGNMENT (Boss → Workers)
```json
{
  "type": "task",
  "payload": {
    "task_id": "fix_railway_001",
    "action": "DIAGNOSE_AND_FIX",
    "target": "railway_deployment",
    "steps": [
      {"id": 1, "action": "check_logs", "timeout": 300},
      {"id": 2, "action": "identify_error", "timeout": 300},
      {"id": 3, "action": "apply_fix", "timeout": 600}
    ],
    "success_criteria": {
      "endpoint_status": 200,
      "error_rate": 0
    }
  }
}
```

#### 3. STATUS_UPDATE (Workers → Boss)
```json
{
  "type": "status",
  "payload": {
    "task_id": "fix_railway_001",
    "step": 2,
    "status": "in_progress",
    "findings": {
      "error_type": "build_failure",
      "root_cause": "missing_env_vars",
      "confidence": 0.95
    },
    "eta_seconds": 480
  }
}
```

#### 4. RESULT (Boss → President)
```json
{
  "type": "result",
  "payload": {
    "directive_id": "emergency_fix_001",
    "status": "partial_success",
    "metrics": {
      "success_rate": 50,
      "improved_from": 25,
      "issues_fixed": 4,
      "issues_remaining": 4
    },
    "next_actions": ["deeper_diagnosis", "external_dependencies_check"]
  }
}
```

## Communication Channels

### 1. Direct Message (agent-send.sh wrapper)
```bash
# Structured message sending
send_structured_msg() {
  local to=$1
  local msg=$2
  echo "$msg" | ./agent-send.sh $to
}
```

### 2. Broadcast Channel
```bash
# All workers receive simultaneously
broadcast_to_workers() {
  local msg=$1
  for worker in worker1 worker2 worker3; do
    send_structured_msg $worker "$msg" &
  done
  wait
}
```

### 3. Status Files (Atomic State)
```
boss1/state.json
worker1/state.json
worker2/state.json
worker3/state.json
```

## Implementation Examples

### President Directive
```javascript
const directive = {
  msg_id: generateUUID(),
  timestamp: new Date().toISOString(),
  from: "president",
  to: "boss1",
  type: "directive",
  priority: 5,
  payload: {
    action: "ACHIEVE_80_PERCENT_SUCCESS",
    deadline: addMinutes(30),
    constraints: {
      preserve_existing_functionality: true,
      document_all_changes: true
    }
  },
  requires_ack: true,
  timeout_ms: 5000
};
```

### Boss Task Distribution
```javascript
const tasks = [
  {
    worker: "worker1",
    focus: "railway_backend",
    actions: ["diagnose", "fix", "verify"]
  },
  {
    worker: "worker2", 
    focus: "vercel_frontend",
    actions: ["api_routes", "env_vars", "test"]
  },
  {
    worker: "worker3",
    focus: "monitoring",
    actions: ["real_time_check", "report_generation"]
  }
];
```

### Worker Status Protocol
```javascript
// Every 30 seconds or on state change
const statusUpdate = {
  task_progress: 0.6,
  blockers: [],
  confidence: 0.8,
  eta: 300
};
```

## Error Handling

### Error Message Format
```json
{
  "type": "error",
  "payload": {
    "error_code": "DEPLOYMENT_FAILED",
    "severity": "critical",
    "details": {
      "service": "railway",
      "message": "Build failed: missing standalone output",
      "stack_trace": "..."
    },
    "recovery_options": [
      "rollback",
      "manual_intervention",
      "retry_with_fix"
    ]
  }
}
```

## Performance Optimizations

1. **Parallel Processing**: Workers operate independently
2. **Async Communication**: Non-blocking message passing
3. **State Caching**: Minimize file I/O
4. **Batch Operations**: Group related tasks

## Human Interface Layer

When reporting to human users, translate to natural language:
```javascript
function humanReadableReport(structuredData) {
  return `
現在の状況:
- 成功率: ${structuredData.metrics.success_rate}%
- 修正済み: ${structuredData.issues_fixed}件
- 残課題: ${structuredData.issues_remaining}件
- 予定時間: ${structuredData.eta_seconds / 60}分
  `;
}
```

## Transition Plan

1. Current task completion with existing protocol
2. Gradual migration to structured format
3. Full implementation by next major directive