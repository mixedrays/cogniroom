import { useState } from "react";
import {
  PaletteIcon,
  BrainCircuitIcon,
  HistoryIcon,
  MessageSquareTextIcon,
  ChevronRightIcon,
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
import { HistorySettings } from "./HistorySettings";
import { PromptsSettings } from "./PromptsSettings";

const NAV_ITEMS = [
  { key: "appearance", label: "Appearance", icon: PaletteIcon },
  { key: "llm", label: "LLM Models", icon: BrainCircuitIcon },
  { key: "prompts", label: "Prompts", icon: MessageSquareTextIcon },
  { key: "history", label: "History", icon: HistoryIcon },
] as const;

type SettingsTab = (typeof NAV_ITEMS)[number]["key"];

interface SettingsContentProps {
  defaultTab?: SettingsTab;
  className?: string;
}

export function SettingsContent({
  defaultTab = "appearance",
  className,
}: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);
  const activeLabel = NAV_ITEMS.find((i) => i.key === activeTab)!.label;

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

        <div className="p-4 h-full overflow-auto">
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "llm" && <LLMSettings />}
          {activeTab === "prompts" && <PromptsSettings />}
          {activeTab === "history" && <HistorySettings />}
        </div>
      </div>
    </SidebarProvider>
  );
}
