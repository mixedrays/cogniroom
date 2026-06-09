# CogniRoom

A local-first platform for creating, managing, and tracking skill learning roadmaps. Generate a roadmap with an LLM, then generate lessons, exercises, flashcards, and quizzes for each step — and track your progress as you learn.

## Features

- **Roadmap creation** — generate a structured learning roadmap from a prompt.
- **Lesson content generation** — produce lessons, exercises, flashcards, and quizzes for any node in the roadmap.
- **Wizard agent** — an AI assistant that guides roadmap creation and content generation end-to-end.
- **Planned**: import existing roadmaps (e.g. roadmap.sh) and extract roadmaps from external sources (YouTube, docs).
- **Multi-provider LLMs** — works with OpenAI and Anthropic models via the Vercel AI SDK; bring your own key or use a server-configured one.
- **Local-first storage** — courses, prompts, settings, and chat history are persisted to a local `data/` directory you control.
- **Focused reading layout** — interactive roadmap sidebar plus a clean, distraction-free content area.
- **Theming** — light/dark modes and configurable color themes.

## Tech Stack

- **Frontend** — [TanStack Start](https://tanstack.com/start), React 19, [Shadcn UI](https://ui.shadcn.com/) (Base UI variant), Tailwind CSS v4
- **Backend** — TanStack Start API routes (Node.js) + [Vercel AI SDK](https://sdk.vercel.ai/)
- **State** — TanStack Query for server state; React hooks/context for local state
- **Storage** — local filesystem (PostgreSQL + Drizzle ORM planned)
- **Tooling** — Vite, Vitest, Puppeteer (e2e), ESLint, Prettier, TypeScript

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- An API key for at least one LLM provider (OpenAI or Anthropic)

## Getting Started

```bash
git clone <repo-url>
cd learning-platform
npm install
cp .env.example .env
# edit .env and add your API key(s)
npm run dev
```

The app runs at `http://localhost:3000`.

## Configuration

Environment variables (see `.env.example`):

| Variable            | Required | Description                                            |
| ------------------- | -------- | ------------------------------------------------------ |
| `OPENAI_API_KEY`    | One of   | OpenAI API key — used for LLM features.                |
| `ANTHROPIC_API_KEY` | One of   | Anthropic API key — alternative LLM provider.          |
| `DATA_PATH`         | No       | Directory for persisted data. Defaults to `./data`.    |
| `APP_NAME`          | No       | Display name shown in the UI. Defaults to `CogniRoom`. |

Keys can also be supplied at runtime from the in-app **Settings** page (stored in `localStorage`) when `useOwnKey` is enabled.

## Scripts

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Start the development server on port 3000. |
| `npm run build`     | Production build.                          |
| `npm run preview`   | Preview the production build locally.      |
| `npm run test`      | Run unit tests (Vitest).                   |
| `npm run test:e2e`  | Run end-to-end tests (Puppeteer).          |
| `npm run test:all`  | Run unit and e2e tests.                    |
| `npm run typecheck` | TypeScript type-check (no emit).           |
| `npm run lint`      | Run ESLint on `src/`.                      |
| `npm run format`    | Format the project with Prettier.          |
| `npm run validate`  | Typecheck + lint + unit + e2e tests.       |

## Project Structure

```
src/
├── components/        # Shared UI components (incl. shadcn/ui primitives)
├── hooks/             # Cross-cutting React hooks
├── lib/               # Shared libraries (LLM models, utilities)
├── modules/           # Feature modules
│   ├── core/          #   Canonical domain types — single source of truth
│   ├── agent/         #   Roadmap/content generation agent
│   ├── wizard-agent/  #   Onboarding/wizard agent
│   ├── flashcards/    #   Flashcard feature
│   ├── quiz/          #   Quiz feature
│   ├── markdown/      #   Markdown rendering
│   ├── content-formats/, md-formats/
│   ├── color-themes/, command-palette/, settings/, storage/
│   └── index.ts
├── routes/            # TanStack Router file-based routes
└── styles.css
data/                  # Local persistence (courses, prompts, settings, history)
tests/                 # E2E tests
```

`src/modules/core` is the single source of truth for shared business entities — extend types there before introducing parallel shapes elsewhere.

## Data & Persistence

All user data lives under `data/` (configurable via `DATA_PATH`):

- `data/courses/` — generated roadmaps and their lessons, exercises, flashcards, quizzes
- `data/prompts/` — saved prompts
- `data/settings/` — app and LLM settings
- `data/history/` — chat / agent history

The app currently runs as a single-user local tool — there is no authentication. Back up the `data/` directory to keep your work.

## Contributing

Contributions are welcome.

1. Fork the repo and create a feature branch.
2. Run `npm run validate` and make sure it passes.
3. Open a pull request describing the change and motivation.

When adding new entities or shared shapes, add the canonical types to `src/modules/core` first.

> `AGENTS.md` is the single source of guidance for AI coding assistants working in this repo (Claude Code and Copilot read it via the `CLAUDE.md` / `.github/copilot-instructions.md` symlinks), not contribution rules for humans.

## License

[MIT](./LICENSE) © mixedrays
