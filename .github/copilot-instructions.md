---
applyTo: "**"
---

# Copilot Instructions

> **Note**: This file is auto-generated from INSTRUCTIONS.md. Edit INSTRUCTIONS.md and run `scripts/sync-instructions.sh` to update.

## Project Overview

CogniRoom - A platform for creating, managing, and tracking skill learning roadmaps. Users can generate roadmaps via LLM, import them (e.g., from roadmap.sh), or extract from external sources (video URLs, documentation pages), then generate lessons, tests, exercises content and track learning progress.

## Technology Stack

- **Frontend**: TanStack Start + Shadcn UI (Base UI version) + Tailwind CSS
- **Backend**: TanStack Start API routes (Node.js) + Vercel AI SDK for LLM interactions
- **Storage**: Local filesystem (PostgreSQL with Drizzle ORM planned for future)
- **State Management**: TanStack Query for global state, React hooks and context for local state in components

## General Guidelines

- Do not provide explanations or summaries of actions unless explicitly requested.
- Do not provide list of made changes.
- Use CLI for moving, renaming, or deleting files instead of suggesting code changes.
- Use `npm install` to install new dependencies, instead of editing `package.json` directly.
- Ensure to handle API responses and errors appropriately when using fetch calls.
- Do not hardcode any API keys or sensitive information in the codebase. Use environment variables instead.
- Do not add comments to the code unless necessary for clarity. The code should be self-explanatory and follow best practices for readability.
- After making changes, run `npm run validate` to run all checks (typecheck, lint, unit tests, e2e tests).
- Do not use git worktrees unless the user explicitly requests them. Work directly in the current checkout.

## Core Domain Modeling

- Treat `src/modules/core` as the single source of truth for core business entities and shared domain types.
- When introducing a new business entity, add its canonical type definitions to the core module first if they do not already exist there.
- Before adding or changing entity types or interfaces, first check whether the shape belongs in the core module and reuse or extend the exported core type instead of redefining a parallel shape elsewhere.
- If a normalized, preview, or otherwise derived representation of a core entity is needed across modules, define that shared type in the core module as an explicit derivation from the base core entity and import it from there.

## Tailwind CSS Guidelines

- Use Tailwind utility classes for styling. Avoid custom CSS unless necessary.
- Use size class for square elements (e.g., `w-4 h-4` can be replaced with `size-4`).
- Use tailwind's class name utility functions (e.g., `cn()`) for conditional classes instead of inline styles or string literals.
  Example:

```tsx
// Good:
<div className={cn("base-class", isActive && "active-class")} />

// Bad:
<div className={`base-class ${isActive ? "active-class" : ""}`} />
```

- Use inline conditional classes with `cn()` instead of object.
  Example:

```tsx
// Good:
<div className={cn("base-class", isActive && "active-class", !isActive && "inactive-class")} />
// Bad:
<div className={cn("base-class", { "active-class": isActive, "inactive-class": !isActive })} />
```

## ShadCn UI Guidelines

- Use Shadcn UI components for consistent design and functionality.
- Do not customize Shadcn components (`src/components/ui`) with additional styles or classes. Use the provided variants, and props for customization.
- Do not add size classes to Button component, use the `size` prop instead (e.g., `size="sm"`).
- Don not add size classes to Icon component inside Button, it will inherit size from the Button.

## CLI Initializers (Token Optimization)

**IMPORTANT**: Always use library CLI initializers instead of generating boilerplate files manually:

| Task                          | Use CLI Command                             | NOT                                   |
| ----------------------------- | ------------------------------------------- | ------------------------------------- |
| Create TanStack Start project | `npm create @tanstack/start@latest`         | Manually writing config files         |
| Add Shadcn components         | `npx shadcn@latest add <component>`         | Writing component code from scratch   |
| Initialize Tailwind           | `npx tailwindcss init`                      | Writing `tailwind.config.js` manually |
| Add Drizzle ORM               | `npm i drizzle-orm && npx drizzle-kit init` | Writing schema boilerplate            |
| Create React app              | `npx create-vite@latest`                    | Writing vite.config.ts manually       |
| Initialize TypeScript         | `npx tsc --init`                            | Writing tsconfig.json manually        |
| Initialize ESLint             | `npm init @eslint/config`                   | Writing .eslintrc manually            |

**Rationale**: CLI tools generate correct, up-to-date boilerplate instantly. LLM-generated configs may be outdated or incorrect.

## Development Commands

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start development server                         |
| `npm run test`      | Run unit tests (vitest)                          |
| `npm run test:e2e`  | Run e2e tests (puppeteer)                        |
| `npm run typecheck` | Check TypeScript types (no emit)                 |
| `npm run lint`      | Run ESLint on `src/`                             |
| `npm run format`    | Format code with Prettier                        |
| `npm run validate`  | Run all checks (typecheck, lint, test, test:e2e) |

## Layout and Design

- **Left Sidebar**: Interactive Skills Roadmap visualization
- **Center Column**: Lesson Content, Tests, Exercises Area (clean, focused reading environment)
- **No authentication**: Single-user local usage (future-proofed for auth)

## Quality Standards

- Zero console errors
- Polished UI matching design specifications
- All features work end-to-end through the UI
- Fast, responsive, professional
