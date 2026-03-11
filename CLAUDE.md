# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

<!-- BMAD:START -->

# BMAD Method — Project Instructions

## Project Configuration

- **Project**: learning-platform
- **User**: MR
- **Communication Language**: English
- **Document Output Language**: English
- **User Skill Level**: intermediate
- **Output Folder**: {project-root}/\_bmad-output
- **Planning Artifacts**: {project-root}/\_bmad-output/planning-artifacts
- **Implementation Artifacts**: {project-root}/\_bmad-output/implementation-artifacts
- **Project Knowledge**: {project-root}/docs

## BMAD Runtime Structure

- **Agent definitions**: `_bmad/bmm/agents/` (BMM module) and `_bmad/core/agents/` (core)
- **Workflow definitions**: `_bmad/bmm/workflows/` (organized by phase)
- **Core tasks**: `_bmad/core/tasks/` (help, editorial review, indexing, sharding, adversarial review)
- **Core workflows**: `_bmad/core/workflows/` (brainstorming, party-mode, advanced-elicitation)
- **Workflow engine**: `_bmad/core/tasks/workflow.xml` (executes YAML-based workflows)
- **Module configuration**: `_bmad/bmm/config.yaml`
- **Core configuration**: `_bmad/core/config.yaml`
- **Agent manifest**: `_bmad/_config/agent-manifest.csv`
- **Workflow manifest**: `_bmad/_config/workflow-manifest.csv`
- **Help manifest**: `_bmad/_config/bmad-help.csv`
- **Agent memory**: `_bmad/_memory/`

## Key Conventions

- Always load `_bmad/bmm/config.yaml` before any agent activation or workflow execution
- Store all config fields as session variables: `{user_name}`, `{communication_language}`, `{output_folder}`, `{planning_artifacts}`, `{implementation_artifacts}`, `{project_knowledge}`
- MD-based workflows execute directly — load and follow the `.md` file
- YAML-based workflows require the workflow engine — load `workflow.xml` first, then pass the `.yaml` config
- Follow step-based workflow execution: load steps JIT, never multiple at once
- Save outputs after EACH step when using the workflow engine
- The `{project-root}` variable resolves to the workspace root at runtime

## Available Agents

| Agent               | Persona     | Title                                                                | Capabilities                                                                             |
| ------------------- | ----------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| bmad-master         | BMad Master | BMad Master Executor, Knowledge Custodian, and Workflow Orchestrator | runtime resource management, workflow orchestration, task execution, knowledge custodian |
| analyst             | Mary        | Business Analyst                                                     | market research, competitive analysis, requirements elicitation, domain expertise        |
| architect           | Winston     | Architect                                                            | distributed systems, cloud infrastructure, API design, scalable patterns                 |
| dev                 | Amelia      | Developer Agent                                                      | story execution, test-driven development, code implementation                            |
| pm                  | John        | Product Manager                                                      | PRD creation, requirements discovery, stakeholder alignment, user interviews             |
| qa                  | Quinn       | QA Engineer                                                          | test automation, API testing, E2E testing, coverage analysis                             |
| quick-flow-solo-dev | Barry       | Quick Flow Solo Dev                                                  | rapid spec creation, lean implementation, minimum ceremony                               |
| sm                  | Bob         | Scrum Master                                                         | sprint planning, story preparation, agile ceremonies, backlog management                 |
| tech-writer         | Paige       | Technical Writer                                                     | documentation, Mermaid diagrams, standards compliance, concept explanation               |
| ux-designer         | Sally       | UX Designer                                                          | user research, interaction design, UI patterns, experience strategy                      |

## Slash Commands

Type `/bmad-` in Copilot Chat to see all available BMAD workflows and agent activators. Agents are also available in the agents dropdown.

<!-- BMAD:END -->
