# Markdown Module Implementation Plan

## Context

The learning platform renders markdown content in 4 places (lessons, exercises, quiz, flashcards) using bare `react-markdown` with no plugins. Content from the LLM can include code blocks, math, diagrams, etc., but none of it renders with syntax highlighting or special formatting. This module consolidates all markdown rendering into a single reusable `<Markdown>` component with rich feature support.

## Features

- Syntax-highlighted code blocks (`rehype-pretty-code` + `shiki`, dual light/dark themes)
- Math formulas — inline `$...$` and block `$$...$$` (`remark-math` + `rehype-katex`)
- GFM — tables, task lists, footnotes, autolinks, strikethrough (`remark-gfm`)
- Admonitions — `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, etc. (`remark-github-blockquote-alert`)
- Mermaid diagrams — lazy-loaded client component for ` ```mermaid ` blocks
- Heading anchors — deep-linking (`rehype-slug` + `rehype-autolink-headings`)
- Copy button on code blocks — custom `<CodeBlock>` component
- Definition lists (`remark-definition-list`)

## File Structure

```
src/modules/markdown/
  index.ts
  components/
    index.ts
    Markdown.tsx          # Public API: <Markdown content={string} variant? className? />
    CodeBlock.tsx          # <pre> wrapper with copy button
    MermaidDiagram.tsx     # Lazy-loaded mermaid renderer
  lib/
    plugins.ts            # Centralized remark/rehype plugin arrays
  styles/
    markdown.css          # KaTeX CSS import, shiki dual-theme, admonitions, definition lists, heading anchors
```

## Implementation Steps

### 1. Install dependencies

```
npm install rehype-pretty-code shiki remark-gfm remark-math rehype-katex rehype-slug rehype-autolink-headings remark-github-blockquote-alert remark-definition-list mermaid katex
```

### 2. Create `src/modules/markdown/lib/plugins.ts`

Centralizes all plugin config:
- `remarkPlugins`: `remark-gfm`, `remark-math`, `remark-definition-list`, `remark-github-blockquote-alert`
- `rehypePlugins`: `rehype-slug`, `rehype-autolink-headings` (behavior: "wrap"), `rehype-katex`, `rehype-pretty-code` (themes: `github-light` / `github-dark`, `defaultColor: false`, `keepBackground: false`)
- `remarkRehypeOptions`: `defListHastHandlers` from `remark-definition-list`

### 3. Create `src/modules/markdown/styles/markdown.css`

- `@import "katex/dist/katex.min.css"`
- Shiki dual-theme toggle (`.shiki` uses `--shiki-light`, `.dark .shiki` uses `--shiki-dark`)
- Admonition styles (`.markdown-alert-note`, `-tip`, `-warning`, `-important`, `-caution`) with Tailwind colors
- `rehype-pretty-code` extras: `[data-highlighted-line]`, `[data-rehype-pretty-code-title]`, line numbers
- Definition list styles (`.prose dl`, `.prose dt`, `.prose dd`)
- Heading anchor styles (no underline by default, underline on hover)

### 4. Create `src/modules/markdown/components/CodeBlock.tsx`

- Wraps `<pre>` with a `group relative` div
- Copy button appears on hover (top-right), uses `navigator.clipboard.writeText`
- Shows `Check` icon for 2s after copying, then reverts to `Copy` icon
- Uses `lucide-react` icons (already in project)

### 5. Create `src/modules/markdown/components/MermaidDiagram.tsx`

- Lazy-loads `mermaid` via dynamic `import("mermaid")` (keeps ~1.5MB out of main bundle)
- Renders SVG into a div via `dangerouslySetInnerHTML`
- Shows spinner while loading, error state on failure
- Detects dark mode from `document.documentElement.classList`
- Wrapped in `React.memo`

### 6. Create `src/modules/markdown/components/Markdown.tsx`

- Uses `MarkdownHooks` from `react-markdown` (handles async `rehype-pretty-code`)
- Accepts `content`, `variant?`, `className?`, `fallback?`
- Variants map to prose class presets:
  - `lesson`: `prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:leading-relaxed`
  - `quiz`: `prose dark:prose-invert text-lg`
  - `flashcard`: `prose dark:prose-invert prose-sm`
  - `default`: `prose dark:prose-invert max-w-none`
- `components` prop overrides:
  - `pre` -> `CodeBlock` (copy button)
  - `code` -> intercepts `language-mermaid` blocks -> `MermaidDiagram`
- Imports `../styles/markdown.css`

### 7. Create barrel exports

- `src/modules/markdown/components/index.ts` — exports `Markdown`
- `src/modules/markdown/index.ts` — re-exports from `./components`
- Add `export * from "./markdown"` to `src/modules/index.ts`

### 8. Migrate consumers (4 files)

| File | Change |
|------|--------|
| `src/routes/course.$courseId.lesson.$lessonId.index.tsx` | Replace `ReactMarkdown` + prose div with `<Markdown content={content} variant="lesson" />` |
| `src/routes/course.$courseId.lesson.$lessonId.exercises.tsx` | Same as above, `variant="lesson"` |
| `src/modules/quiz/components/Quiz.tsx` | Replace with `<Markdown content={q.question} variant="quiz" />` |
| `src/modules/flashcards/components/Flashcard.tsx` | Replace with `<Markdown content={content} variant="flashcard" />` |

### 9. Adjust existing CSS in `src/styles.css`

- Keep `.prose code` inline styles as-is (rehype-pretty-code doesn't affect inline code)
- Keep `.prose pre` structural styles (rounded, border, padding, shadow) — compatible with shiki output
- Keep `.prose pre code` reset — compatible with shiki output
- No removal needed since `keepBackground: false` preserves existing `--code-bg` variable usage

## Key Decisions

- **`MarkdownHooks`** (not `Markdown` default or `MarkdownAsync`): required because `rehype-pretty-code` is async. `MarkdownHooks` uses `useEffect`/`useState` internally to handle async plugins on the client, with a `fallback` prop for loading state.
- **GitHub-style admonitions** (`> [!NOTE]`) over `:::note` directives: this is the syntax LLMs naturally produce and developers recognize.
- **Client-side mermaid** over `rehype-mermaid`: avoids Playwright server dependency, works with TanStack Start SSR.
- **`github-light`/`github-dark`** shiki themes with `defaultColor: false`: outputs CSS variables that toggle via `.dark` class, matching the project's existing dark mode system.

## Verification

1. Run `npm run dev` and navigate to a lesson with content
2. Verify syntax-highlighted code blocks with copy button
3. Test dark/light mode toggle — code themes, admonitions, mermaid should all adapt
4. Test with markdown containing: `$E=mc^2$`, GFM table, `> [!NOTE]`, ` ```mermaid ` diagram, definition list, footnote, task list
5. Check zero console errors
6. Verify flashcard and quiz views still render correctly with the new component
