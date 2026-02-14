import type { PluggableList } from "unified";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
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
