import { useState, useCallback, useRef, type ComponentProps } from "react";
import { Copy, Check } from "lucide-react";

export function CodeBlock(props: ComponentProps<"pre">) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = useCallback(() => {
    const text = preRef.current?.textContent ?? "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="group relative">
      <pre ref={preRef} {...props} />
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md border border-white/10 bg-white/5 p-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="size-4 text-green-400" />
        ) : (
          <Copy className="size-4 text-gray-400" />
        )}
      </button>
    </div>
  );
}
