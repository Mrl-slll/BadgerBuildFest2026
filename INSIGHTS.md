# Insights implementation

The home route and `/insights` render a descriptive history workspace. The route supplies explicitly labeled fictional sample data; `components/insights.tsx` accepts the shared `HealthData` contract and an inclusive end date for integration with a future data provider. No personal-data storage or external requests are added. Question selections last only while the page is mounted.

Implemented: synchronized 30/90/180-day ranges, toggleable timeline layers, keyboard/date exploration, medication start/end markers, overlapping cycle history, symptom frequencies and split-period comparisons, weekly sleep/energy averages, descriptive observations, medication side-effect context, clinician question selection, and a dedicated print summary.

Missing values do not become zeros. Completed cycles require two recorded starts; future starts are excluded. Daily calculations deduplicate dates and scope records to the supplied user. Medication treatment periods do not assert doses taken. Comparisons include their separate logging denominators.

## Validation

- `npm test`: data calculation regression tests (Node 22.15+ / 24 recommended for native TypeScript and module hooks).
- `npm run typecheck`: TypeScript.
- `npm run lint`: ESLint.
- `npm run build -- --webpack`: production build passed. The default Turbopack build hit an environment worker-port permission error.
- Local `/insights` HTTP smoke check: 200.

Frontend-design guided the implementation using DESIGN.md. Hallmark and Web Interface Guidelines code review covered hierarchy, contrast, semantic controls, empty states, focus visibility, missing-data labeling, responsive rules, and print isolation. Browser discovery returned no connected browsers, so visual verification, interactive browser tests, print preview, and the required viewport checks remain unverified. Intended viewport checks: 1440, 1024, 768, 430, 390 (plus 320, 375, 414) pixels.

No tracking forms, authentication, or AI/chat work was added.
