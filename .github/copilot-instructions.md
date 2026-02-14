---
applyTo: '**'
---

# Copilot Instructions

> **Note**: This file is auto-generated from INSTRUCTIONS.md. Edit INSTRUCTIONS.md and run `scripts/sync-instructions.sh` to update.


## Project Overview

Skills Learning Platform - A platform for creating, managing, and tracking skill learning roadmaps. Users can generate roadmaps via LLM, import them (e.g., from roadmap.sh), or extract from external sources (video URLs, documentation pages), then generate lessons, tests, exercises content and track learning progress.

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

## Tailwind CSS Guidelines

- Use Tailwind utility classes for styling. Avoid custom CSS unless necessary.
- Use size class for square elements (e.g., `w-4 h-4` can be replaced with `size-4`).

## ShadCn UI Guidelines

- Use Shadcn UI components for consistent design and functionality.
- Do not customize Shadcn components with additional styles or classes. Use the provided variants, and props for customization.

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

Run and validate tests

`npm run test`

Run development server

`npm run dev`

## Testing Requirements

All testing must use browser automation tools (puppeteer-based):

- `puppeteer_navigate` - Start browser and go to URL
- `puppeteer_screenshot` - Capture screenshots
- `puppeteer_click` - Click elements
- `puppeteer_fill` - Fill form inputs

Test like a human user with mouse and keyboard. Take screenshots at each step. Never bypass UI with JavaScript evaluation.

## Layout and Design

- **Left Sidebar**: Interactive Skills Roadmap visualization
- **Center Column**: Lesson Content, Tests, Exercises Area (clean, focused reading environment)
- **No authentication**: Single-user local usage (future-proofed for auth)

## Quality Standards

- Zero console errors
- Polished UI matching design specifications
- All features work end-to-end through the UI
- Fast, responsive, professional
