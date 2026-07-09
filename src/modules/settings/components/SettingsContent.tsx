import { useState, useEffect, useRef } from "react";
import {
  PaletteIcon,
  BrainCircuitIcon,
  BrainIcon,
  HistoryIcon,
  MessageSquareTextIcon,
  ChevronRightIcon,
  KeyRoundIcon,
  InfoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { AppearanceSettings } from "./AppearanceSettings";
import { LLMSettings } from "./LLMSettings";
import { ApiKeySettings } from "./ApiKeySettings";
import { HistorySettings } from "./HistorySettings";
import { PromptsSettings } from "./PromptsSettings";
import { MemorySettings } from "./MemorySettings";
import { AboutSettings } from "./AboutSettings";

const NAV_ITEMS = [
  { key: "appearance", label: "Appearance", icon: PaletteIcon },
  { key: "llm", label: "LLM Models", icon: BrainCircuitIcon },
  { key: "api-key", label: "API Key", icon: KeyRoundIcon },
  { key: "prompts", label: "Prompts", icon: MessageSquareTextIcon },
  { key: "memory", label: "Memory", icon: BrainIcon },
  { key: "history", label: "History", icon: HistoryIcon },
  { key: "about", label: "About", icon: InfoIcon },
] as const;

type SettingsTab = (typeof NAV_ITEMS)[number]["key"];

interface SettingsContentProps {
  defaultTab?: SettingsTab;
  defaultPromptId?: string;
  section?: string;
  className?: string;
}

export function SettingsContent({
  defaultTab = "appearance",
  defaultPromptId,
  section,
  className,
}: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);
  const activeLabel = NAV_ITEMS.find((i) => i.key === activeTab)!.label;
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (!section) return;
    // Wait for tab content to render before scrolling
    const timer = setTimeout(() => {
      const el = scrollAreaRef.current?.querySelector(
        `[data-settings-section="${section}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [section, activeTab]);

  return (
    <SidebarProvider className={cn("min-h-0 flex-1", className)}>
      <Sidebar collapsible="none" className="border-r">
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setActiveTab(item.key)}
                      className={cn(
                        isActive &&
                          "bg-secondary/70 border-primary text-primary"
                      )}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-center gap-1.5 px-4 py-4">
          <span className="text-muted-foreground">Settings</span>
          <ChevronRightIcon className="size-3.5 text-muted-foreground" />
          <span className="font-medium">{activeLabel}</span>
        </div>

        <div ref={scrollAreaRef} className="p-4 h-full overflow-auto">
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "llm" && <LLMSettings />}
          {activeTab === "api-key" && <ApiKeySettings />}
          {activeTab === "prompts" && (
            <PromptsSettings
              defaultPromptId={
                defaultPromptId ??
                (activeTab === defaultTab ? section : undefined)
              }
            />
          )}
          {activeTab === "memory" && <MemorySettings />}
          {activeTab === "history" && <HistorySettings />}
          {activeTab === "about" && <AboutSettings />}
        </div>
      </div>
    </SidebarProvider>
  );
}
