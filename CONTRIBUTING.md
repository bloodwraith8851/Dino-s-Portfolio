# Contributing to Dino's Portfolio

Thank you for your interest in contributing! This document covers the most common contribution workflows.

## Development Setup

```bash
git clone https://github.com/bloodwraith8851/Dino-s-Portfolio.git
cd Dino-s-Portfolio
npm install
npm run dev
```

## Adding a New Terminal Command

The terminal uses a modular command-handler architecture. Here's how to add a new command end-to-end.

### 1. Create a handler function

Place it in the appropriate file under `src/terminal/commands/`:

| File | Use for |
|------|---------|
| `funCommands.ts` | API fetches, easter eggs, games |
| `socialCommands.ts` | Guestbook, polls, community features |
| `adminCommands.ts` | Admin-only operations |

If your command doesn't fit, create a new file and import it in `commandProcessor.ts`.

Your handler must accept at minimum an `AddLine` callback and optionally `AddLines` or the full `CommandContext`:

```ts
import type { AddLine } from '../types';

/**
 * Handles the `greet` command — prints a personalised greeting.
 * @param addLine - Terminal line appender.
 * @param name    - Optional name argument passed by the user.
 */
export function handleGreet(addLine: AddLine, name: string) {
  const target = name || 'World';
  addLine({ type: 'output', text: ` Hello, <span class="t-green">${target}</span>!` });
}
```

### 2. Register it in `commandProcessor.ts`

Open `src/terminal/commandProcessor.ts` and add a `case` in the `switch (baseCmd)` block:

```ts
case 'greet':
  fun.handleGreet(addLine, args);
  break;
```

### 3. Import your module

If you created a new commands file, import it at the top of `commandProcessor.ts`:

```ts
import * as myCommands from './commands/myCommands';
```

### 4. Add help text

Open `src/terminal/constants.ts` and add your command to the relevant `HELP_*` constant so users can discover it via `help`.

### 5. Write a test

Add a test case in `src/__tests__/commandProcessor.test.ts`:

```ts
it('greet command prints hello', async () => {
  await processCommand('greet world', defaultCtx, defaultActions, {
    isFirstTime: false,
    isHelpMode: false,
  });
  expect(mockAddLine).toHaveBeenCalledWith(
    expect.objectContaining({ text: expect.stringContaining('Hello') })
  );
});
```

## Code Quality Standards

Before submitting a PR, ensure all checks pass locally:

```bash
npm run lint        # 0 warnings
npm run typecheck   # 0 errors
npm run test        # all tests pass
```

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add greet command to terminal
fix: correct weather API fallback URL
chore: update dependencies
```

## File Structure Overview

```
src/
├── App.tsx                  # Root component — calls useBanCheck, usePresence, usePageTracking
├── hooks/                   # Custom React hooks extracted from App.tsx
│   ├── useBanCheck.ts
│   ├── usePresence.ts
│   └── usePageTracking.ts
├── components/              # Page sections and shared UI components
├── terminal/
│   ├── commandProcessor.ts  # Central command router (switch/case)
│   ├── commands/            # Individual command handler modules
│   ├── components/          # Terminal UI: input, lines, title bar
│   ├── constants.ts         # Help text, ASCII art, static command output
│   ├── sanitize.ts          # DOMPurify-based HTML sanitizer
│   └── types.ts             # Shared TypeScript interfaces
└── lib/                     # Supabase, Neon DB, and error reporting clients
```
