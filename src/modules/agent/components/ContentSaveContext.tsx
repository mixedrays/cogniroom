import { createContext, useContext, type ReactNode } from "react";
import type { ContentBubbleType } from "./ContentBubble";

export interface ContentSaveOverrideArgs {
  type: ContentBubbleType;
  content: unknown;
  summary?: string;
}

export interface ContentSaveOverrideResult {
  success: boolean;
  error?: string;
  id?: string;
}

export type ContentSaveOverride = (
  args: ContentSaveOverrideArgs
) => Promise<ContentSaveOverrideResult>;

const ContentSaveContext = createContext<ContentSaveOverride | null>(null);

interface ContentSaveProviderProps {
  override: ContentSaveOverride;
  children: ReactNode;
}

export function ContentSaveProvider({
  override,
  children,
}: ContentSaveProviderProps) {
  return (
    <ContentSaveContext.Provider value={override}>
      {children}
    </ContentSaveContext.Provider>
  );
}

export function useContentSaveOverride(): ContentSaveOverride | null {
  return useContext(ContentSaveContext);
}
