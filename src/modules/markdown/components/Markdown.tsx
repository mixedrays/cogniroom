import { type ReactNode } from "react";
import { type Components, MarkdownHooks } from "react-markdown";
import { cn } from "@/lib/utils";
import { remarkPlugins, rehypePlugins, remarkRehypeOptions } from "../lib/plugins";
import { CodeBlock } from "./CodeBlock";
import { MermaidDiagram } from "./MermaidDiagram";
import "../styles/markdown.css";

const variantClasses = {
  lesson:
    "prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:leading-relaxed",
  quiz: "prose dark:prose-invert text-lg",
  flashcard: "prose dark:prose-invert text-lg",
  default: "prose dark:prose-invert max-w-none",
} as const;

type Variant = keyof typeof variantClasses;

interface MarkdownProps {
  content: string;
  variant?: Variant;
  className?: string;
  fallback?: ReactNode;
}

function MermaidBlock(props: Record<string, unknown>) {
  return <MermaidDiagram chart={props.chart as string} />;
}

export function Markdown({
  content,
  variant = "default",
  className,
  fallback,
}: MarkdownProps) {
  return (
    <div className={cn(variantClasses[variant], className)}>
      <MarkdownHooks
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        remarkRehypeOptions={remarkRehypeOptions}
        components={{ pre: CodeBlock, "mermaid-diagram": MermaidBlock } as Components}
        fallback={fallback}
      >
        {content}
      </MarkdownHooks>
    </div>
  );
}
