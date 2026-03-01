# Mermaid Rendering E2E Fixture

This lesson is used by automated e2e tests for mermaid diagram rendering. Do not edit manually.

## Flowchart

```mermaid
flowchart LR
  A[Start] --> B{Is it working?}
  B -->|Yes| C[Great!]
  B -->|No| D[Debug]
  D --> B
```

## Sequence Diagram

```mermaid
sequenceDiagram
  participant Client
  participant Server
  Client->>Server: GET /api/data
  Server-->>Client: 200 OK
  Client->>Server: POST /api/update
  Server-->>Client: 201 Created
```

## Regular Code Block

This block should render as syntax-highlighted code, not through mermaid.

```javascript
const x = 42;
console.log(x);
```
