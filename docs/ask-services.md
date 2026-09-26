# Ask integration

Open /ask after running npm run dev. It starts without records or personalization.
Load example history, then explicitly enable it to try a personalized scripted
response. Nothing on this page is persisted. Questions are independent, not a
multi-turn conversation.

The reusable components/ask.tsx component accepts an optional HealthData prop.
A host application can supply its current records without a second store or
an invented localStorage key. The user must opt in on the Ask page. Only the
question is sent when personalization is off.

POST /api/ask accepts { question, data? } and returns { answer, provider }.
The development endpoint validates consented records, scopes them by owner,
and builds a 90-day context with distinct-day symptom counts, period starts,
overlapping medications, and dated lab values with units and reference ranges.
Context excludes identity, notes, appointments, and saved questions. The
development request can contain raw records; the projection happens on the
server. Do not treat a client-supplied owner ID as authentication.

ResearchRetriever is independently injectable. Its development implementation
explicitly returns not-connected and no citations. AIService retains history
and visit-summary methods for other owners; no visit-summary UI is implemented.

## Databricks integration boundary

lib/server/services.ts is guarded by server-only. It defines contracts for
Databricks Model Serving, Vector Search retrieval, and an authenticated context
repository. No Databricks network integration or credential is present.
AI_PROVIDER defaults to development; any other value fails closed with a 503.

Before enabling a real provider, implement authenticated server identity and
repository authorization, a curated research index with source provenance,
validated model outputs, request limits, cancellation/timeouts, and the
application's consent and retention policy. Model prompts must treat user
records and retrieved passages as untrusted data. Use the minimized
HealthContext, not raw HealthData, for model requests.

Use server-managed workload identity/OAuth or a server-only secret store.
Never use NEXT_PUBLIC variables for credentials, accept credentials from the
browser, return provider configuration in an API response, or log health
payloads. Bind real adapters only in the server factory after authentication
is implemented. These are integration interfaces, not a claim of a live
Databricks connection.

Checks: npm run typecheck, npm run lint, npm run test:ask.
