import { type Components, MarkdownHooks } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  p: ({ children }) => <>{children}</>,
  pre: ({ children }) => (
    <pre className="my-1 block overflow-x-auto rounded bg-muted p-2 font-mono text-xs">
      {children}
    </pre>
  ),
  code: ({ children, className }) =>
    className?.includes("language-") ? (
      <code>{children}</code>
    ) : (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
        {children}
      </code>
    ),
};

interface InlineMarkdownProps {
  content: string;
  className?: string;
}

export function InlineMarkdown({ content, className }: InlineMarkdownProps) {
  return (
    <span className={className}>
      <MarkdownHooks remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </MarkdownHooks>
    </span>
  );
}
