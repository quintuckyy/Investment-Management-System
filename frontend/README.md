# Frontend

React 19 + TypeScript + Vite + Tailwind CSS. See the [project README](../README.md) for the full picture.

```bash
npm install
cp .env.example .env   # optional; sets VITE_API_URL (defaults to http://127.0.0.1:8000/api)
npm run dev            # http://localhost:5173
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and produce a production build |
| `npm test` | Run unit tests (Vitest + Testing Library) |
| `npm run lint` | ESLint |

## Layout

- `src/api/client.ts`: the single axios instance; attaches the auth token and signs the user out on `401`.
- `src/auth/`: `AuthProvider` (login, logout, session restore) and its tests.
- `src/hooks/useResource.ts`: load + create / update / delete for list endpoints.
- `src/utils/errors.ts`: turns API failures into readable messages and per-field errors.
- `src/utils/csv.ts`: CSV preview and header validation used by the import page.
- `src/components/`: shared UI (modal, confirm dialog, form field, notices, protected route).
- `src/pages/`: one file per screen.
