# Contributing

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/naan-thanda-leo.git
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. Install dependencies:
   ```bash
   cd public
   npm install
   ```
5. Make your changes
6. Run the full CI pipeline locally:
   ```bash
   npm run ci
   ```
7. Commit and push
8. Open a Pull Request

---

## Development Workflow

```bash
# Start dev server with hot reload
npm run dev

# Run tests in watch mode during development
npm run test:watch

# Run specific test file
npx vitest run components/__tests__/YourComponent.test.tsx

# Check types
npm run typecheck

# Lint
npm run lint
```

---

## Code Style

- **TypeScript** — strict mode, no `any` when possible, interfaces over types for objects
- **React** — functional components with hooks, no class components
- **Imports** — group by: (1) React/external, (2) services/utilities, (3) types, (4) components
- **Naming** — PascalCase for components, camelCase for functions/variables, UPPER_CASE for constants
- **CSS** — Tailwind utility classes via `className`, no separate CSS files
- **File size** — keep components under 500 lines; extract utilities into `services/`

---

## Commit Conventions

Follow conventional commits:

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Code style changes (formatting, no logic change) |
| `refactor:` | Code restructuring |
| `test:` | Test additions or fixes |
| `chore:` | Build, CI, dependencies |

Examples:
```
feat: add weekly challenge progress bar to dashboard
fix: prevent nutrition form double-submit on rapid clicks
docs: add Firestore schema to FIREBASE_SETUP.md
test: add integration tests for AI coach streaming
```

---

## Pull Request Process

1. **Title** should follow conventional commits format
2. **Description** should explain what and why, not how
3. **Linked issues** by number (e.g., "Closes #42")
4. **Checklist** in PR body:
   - [ ] Tests pass (`npm run ci`)
   - [ ] New tests added for new functionality
   - [ ] TypeScript types are correct
   - [ ] No lint warnings in changed files
   - [ ] Documentation updated (if applicable)
5. **Request review** from at least one maintainer

---

## Testing Guidelines

- Every new component should have a matching test file
- Every bug fix should include a test that reproduces the bug
- Integration tests should cover the user flow end-to-end
- Mock external services (Firebase, Gemini) — never make real API calls in tests
- Follow the mocking patterns in [TESTING.md](TESTING.md)

---

## Adding a New View

1. Create the component file in `components/`
2. Create the test file in `components/__tests__/`
3. Add the import and lazy load in `App.tsx`
4. Add the view case in the main content area
5. Add a `NavItem` in the sidebar
6. Update `ARCHITECTURE.md` if adding significant new functionality

---

## Environment Variables

Never commit real API keys. Use `.env.example` for documentation and `.env.local` for local development (gitignored by default).
