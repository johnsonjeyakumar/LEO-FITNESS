# Testing Guide

## Test Strategy

This project uses **Vitest** with **React Testing Library** for a comprehensive test suite covering unit and integration tests.

| Layer | Tools | Coverage |
|-------|-------|----------|
| **Unit (Services)** | Vitest | Firestore CRUD, gemini service, adaptive training, gamification, context builder |
| **Unit (Components)** | Vitest + RTL + user-event | 16 component test files covering all views |
| **Integration** | Vitest + RTL | 11 cross-cutting user flows (auth, onboarding, workout, nutrition, progress, etc.) |

---

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (for development)
npm run test:watch

# With coverage report
npm run test:coverage

# Run a specific test file
npx vitest run components/__tests__/Login.test.tsx

# Run tests matching a pattern
npx vitest run -t "submits nutrition"

# CI pipeline (lint + typecheck + test + build)
npm run ci
```

---

## Test File Structure

```
components/__tests__/
├── Login.test.tsx            # 15 tests — auth flows, error handling, loading states
├── SignUp.test.tsx           # 13 tests — registration with validation
├── ForgotPassword.test.tsx   # 8 tests — password reset flow
├── Dashboard.test.tsx        # 13 tests — streaks, stats, meal suggestions
├── WorkoutView.test.tsx      # 14 tests — plan generation, timer, session logging
├── Nutrition.test.tsx        # 14 tests — macro cards, entry CRUD, form modal
├── Progress.test.tsx         # 19 tests — measurements, charts, logs tab
├── Achievements.test.tsx     # 12 tests — badge rendering, unlock states
├── AICoach.test.tsx          # 14 tests — chat, streaming, TTS, error handling
├── Analytics.test.tsx        # 18 tests — insights, comparisons, export
├── CalendarView.test.tsx     # Calendar rendering, event display
├── ExportCenter.test.tsx     # 2 tests — JSON export flow
├── WorkoutChart.test.tsx     # Chart rendering, empty states
├── Integration.test.tsx      # 71 tests — 11 cross-module user flows
├── mocks.ts                  # Shared mock data
└── testUtils.tsx             # Shared test utilities & fixtures

services/__tests__/
├── firestoreService.test.ts
├── geminiService.test.ts
├── adaptiveTrainingService.test.ts
├── contextBuilderService.test.ts
└── gamificationService.test.ts
```

---

## Mocking Patterns

### Firebase Auth

```typescript
vi.mock('../../services/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
}));
```

### Firestore Service

```typescript
const mockSaveNutritionEntry = vi.fn();
const mockDeleteNutritionEntry = vi.fn();

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    saveNutritionEntry: (...args: any[]) => mockSaveNutritionEntry(...args),
    deleteNutritionEntry: (...args: any[]) => mockDeleteNutritionEntry(...args),
  },
}));
```

### Gemini Service

```typescript
const mockGenerateWorkout = vi.fn();

vi.mock('../../services/geminiService', () => ({
  geminiService: {
    generateWorkout: (...args: any[]) => mockGenerateWorkout(...args),
  },
}));
```

### Framer Motion

Framer Motion must be mocked to native HTML elements because jsdom does not support animation APIs:

```typescript
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    span: 'span',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    p: 'p',
    img: 'img',
  },
  AnimatePresence: ({ children }: any) => children,
}));
```

### react-markdown

```typescript
vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}));
```

### Shared Mocks via `vi.hoisted()`

For integration tests, shared mock functions must be hoisted to the top of the module:

```typescript
const { mockOnUpdateEntries } = vi.hoisted(() => ({
  mockOnUpdateEntries: vi.fn(),
}));
```

---

## Test Setup

`setupTests.ts` configures the jsdom environment:

```typescript
import '@testing-library/jest-dom/vitest';

// Mock matchMedia for framer-motion responsive hooks
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock canvas for Recharts
HTMLCanvasElement.prototype.getContext = vi.fn() as any;

// Mock ResizeObserver for Recharts responsive containers
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
}));
```

---

## Writing Tests

### Component Test Template

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyComponent from '../MyComponent';
import { mockProfile } from './testUtils';

const mockCallback = vi.fn();

vi.mock('../../services/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MyComponent', () => {
  it('renders the heading', () => {
    render(<MyComponent profile={mockProfile} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent onAction={mockCallback} />);
    await user.click(screen.getByText('Submit'));
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

### Text Query Best Practices

- Use `screen.getByText('Exact Text')` for exact match
- Use `screen.getByText(/partial text/)` or `screen.getByText('text', { exact: false })` for partial
- Use `screen.getByLabelText('label')` for form inputs
- Use `screen.getByPlaceholderText('placeholder')` for input placeholders
- Use `screen.getByRole('button', { name: /submit/i })` for buttons
- Avoid `screen.getByTestId()` unless absolutely necessary

### Async Patterns

```typescript
// Wait for element to appear (loading states, modals)
await waitFor(() => {
  expect(screen.getByText('Loaded Content')).toBeInTheDocument();
});

// Wait for mock callback
await waitFor(() => {
  expect(mockCallback).toHaveBeenCalledWith(expectedArgs);
});

// Use findByText which returns a promise
const el = await screen.findByText('Delayed Content');
```

---

## Common Pitfalls

1. **Framer Motion not mocked** — always add the mock in each test file that renders a component using framer-motion (components with `motion.div`, `motion.button`, `AnimatePresence`)

2. **`vi.clearAllMocks()` in `beforeEach`** — always reset mocks between tests to prevent state leakage

3. **`userEvent.setup()` before render** — call `setup()` before the first render to ensure proper event timing

4. **Multiple text matches** — use `getAllByText()` or more specific selectors when text appears multiple times (digits, common words)

5. **Firebase auth not mocked** — components that call `auth.currentUser?.uid` need the Firebase mock to provide a `currentUser`

6. **Async state updates** — use `waitFor` or `findBy*` wrappers for content that appears after state changes
