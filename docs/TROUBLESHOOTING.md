# Troubleshooting

## Build & Dev Server

### `Vite build fails with module resolution errors`

**Cause:** Missing or corrupted `node_modules`.

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### `VITE_GEMINI_API_KEY is not set`

**Cause:** Missing `.env.local` file.

**Fix:**
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your actual Gemini API key.

### `Failed to load config from vite.config.ts`

**Cause:** TypeScript configuration issue with environment variables.

**Fix:** Ensure `.env.local` exists with `VITE_GEMINI_API_KEY` set. A placeholder value is sufficient for building.

---

## Firebase

### `Firebase: Error (auth/network-request-failed)`

**Cause:** Network issue, or Firebase project not properly configured.

**Fix:**
- Check internet connection
- Verify Firebase Authentication is enabled in the [Firebase Console](https://console.firebase.google.com)
- Ensure Email/Password sign-in method is enabled

### `Firebase: Error (auth/email-already-in-use)`

**Cause:** The email address is already registered.

**Fix:** Use a different email or navigate to the login screen.

### `Firebase: Error (auth/invalid-credential)`

**Cause:** Wrong email or password.

**Fix:** Check credentials or use the "Forgot Password" flow.

### `Firestore: PERMISSION_DENIED`

**Cause:** Firestore security rules blocking access.

**Fix:** Ensure your Firebase project's Firestore rules allow authenticated access:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Tests

### Tests fail with `framer-motion` errors

**Cause:** Framer Motion is not mocked. The `motion` components use browser animation APIs that don't exist in jsdom.

**Fix:** Add the framer-motion mock at the top of your test file:
```typescript
vi.mock('framer-motion', () => ({
  motion: { div: 'div', button: 'button', span: 'span', h1: 'h1', h2: 'h2', h3: 'h3', p: 'p', img: 'img' },
  AnimatePresence: ({ children }: any) => children,
}));
```

### Tests fail with `Unable to find an element`

**Cause:** Text not rendered in the DOM, or text selector is too strict.

**Fix:**
- Check the component renders the expected text (use `screen.debug()`)
- Use regex instead of exact match: `getByText(/partial text/)`
- Check if component requires mocked auth (`auth.currentUser?.uid`)
- Wrap in `await waitFor()` if content appears after state changes

### Tests fail with `Found multiple elements with the text`

**Cause:** Text appears multiple times in the rendered output.

**Fix:** Use `getAllByText()` and check the count, or refine the selector:
```typescript
const elements = screen.getAllByText(/80/);
expect(elements.length).toBeGreaterThan(0);
```

### `appendChild` / `scrollIntoView` errors

**Cause:** Components or tests that manipulate the DOM directly (export features, chat scrolling) need these methods mocked.

**Fix for scrollIntoView:**
```typescript
Element.prototype.scrollIntoView = vi.fn() as any;
```

### Test timeout

**Cause:** Async operation never resolves — typically a mock that never resolves or a form submission that never triggers.

**Fix:**
- Ensure mock functions resolve/reject as expected
- Check that `user.click()` targets the correct element
- Increase timeout: `waitFor(() => ..., { timeout: 5000 })`
- Check form buttons have `type="submit"` when testing form submission

---

## Gemini AI

### API Key is "Present" but generation fails

**Cause:** Invalid API key, or the key does not have access to the Gemini API.

**Fix:** Generate a new key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### `Model not found` or `404` errors

**Cause:** The model name `gemini-2.0-flash-exp` may have been deprecated or renamed.

**Fix:** Check [Gemini API documentation](https://ai.google.dev/gemini-api/docs/models) for the current model name and update in `geminiService.ts`.

### Streaming returns no tokens

**Cause:** Network issue or content safety filters blocking the response.

**Fix:**
- Check browser console for safety ratings
- Try a different prompt
- Check network tab for API response

---

## Capacitor (Mobile)

### `npx cap sync` fails

**Cause:** Missing native platform directory.

**Fix:**
```bash
npx cap add android
npx cap add ios
```

### Android build fails in Android Studio

**Cause:** Gradle version mismatch or SDK not installed.

**Fix:**
- Install Android SDK 34+
- Ensure `ANDROID_HOME` environment variable is set
- Update Gradle in `android/` directory if needed

---

## Common Error Messages

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| `Cannot read properties of undefined (reading 'response')` | Gemini API not initialized | Check API key |
| `Failed to execute 'appendChild' on 'Node'` | Component creating non-DOM elements | Fix mock or component |
| `messagesEndRef.current?.scrollIntoView is not a function` | `scrollIntoView` not mocked | Add `Element.prototype.scrollIntoView = vi.fn()` |
| `Transform failed with 1 error` | Syntax error in a file (usually test file) | Fix the syntax error |
| `TypeError: Cannot create components during render` | Component defined inside another component | Extract to separate variable |
