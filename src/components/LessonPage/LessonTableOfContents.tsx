import { useEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface LessonTableOfContentsProps {
  contentRef: RefObject<HTMLElement | null>;
}

const HEADER_OFFSET = 80;

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

export function LessonTableOfContents({
  contentRef,
}: LessonTableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const suppressActiveUpdate = useRef(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
    },
    []
  );

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const scan = () => {
      const headings = Array.from(
        content.querySelectorAll<HTMLElement>("h2[id], h3[id]")
      );
      setItems(
        headings.map((h) => ({
          id: h.id,
          text: h.textContent?.trim() ?? "",
          level: Number(h.tagName[1]),
        }))
      );
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(content, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [contentRef]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || items.length === 0) return;

    const root = getScrollParent(content);
    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size > 0 && !suppressActiveUpdate.current) {
          const topmost = [...visible.entries()].sort(
            (a, b) => a[1] - b[1]
          )[0][0];
          setActiveId(topmost);
        }
      },
      {
        root,
        rootMargin: `-${HEADER_OFFSET}px 0px -66% 0px`,
        threshold: 0,
      }
    );

    for (const item of items) {
      const el = content.querySelector(`#${CSS.escape(item.id)}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items, contentRef]);

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const content = contentRef.current;
    const el = content?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!el) return;

    suppressActiveUpdate.current = true;
    setActiveId(id);

    const root = getScrollParent(content);
    if (releaseTimer.current) clearTimeout(releaseTimer.current);

    const release = () => {
      suppressActiveUpdate.current = false;
      root?.removeEventListener("scrollend", release);
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
    };
    releaseTimer.current = setTimeout(release, 1000);

    if (root) {
      const top =
        el.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        HEADER_OFFSET;
      root.addEventListener("scrollend", release);
      root.scrollTo({ top, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (items.length === 0) return null;

  return (
    <nav className="sticky top-3 max-h-[calc(100vh-2rem)] overflow-y-auto py-8">
      <p className="mb-3 text-sm font-medium text-foreground">On This Page</p>

      <ul className="border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={cn(
                "-ml-px block rounded-r-sm border-l py-1 pr-2 text-sm transition-colors hover:text-foreground",
                item.level === 3 ? "pl-6" : "pl-3",
                activeId === item.id
                  ? "border-foreground bg-accent text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
