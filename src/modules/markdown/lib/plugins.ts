import type { PluggableList } from "unified";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import type { Root, Element, Text } from "hast";
import { visit } from "unist-util-visit";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkDefinitionList, {
  defListHastHandlers,
} from "remark-definition-list";
import remarkGithubBlockquoteAlert from "remark-github-blockquote-alert";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";

function rehypeMermaid() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (
        node.tagName !== "pre" ||
        node.children.length !== 1 ||
        node.children[0].type !== "element" ||
        node.children[0].tagName !== "code"
      )
        return;

      const code = node.children[0] as Element;
      const classes = (code.properties?.className as string[]) ?? [];
      if (!classes.includes("language-mermaid")) return;

      const chart = (code.children as Text[])
        .filter((c) => c.type === "text")
        .map((c) => c.value)
        .join("");

      if (parent && typeof index === "number") {
        parent.children[index] = {
          type: "element",
          tagName: "mermaid-diagram",
          properties: { chart },
          children: [],
        };
      }
    });
  };
}

export const remarkPlugins: PluggableList = [
  remarkGfm,
  remarkMath,
  remarkDefinitionList,
  remarkGithubBlockquoteAlert,
];

export const rehypePlugins: PluggableList = [
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: "wrap" }],
  rehypeKatex,
  rehypeMermaid,
  [
    rehypePrettyCode,
    {
      theme: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
      keepBackground: false,
    },
  ],
];

export const remarkRehypeOptions: RemarkRehypeOptions = {
  handlers: {
    ...defListHastHandlers,
  },
};
