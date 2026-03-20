import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { WizardAgentDialog } from "@/modules/wizard-agent";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const [agentOpen, setAgentOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleOpenChange = (open: boolean) => {
    setAgentOpen(open);
    if (!open) {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    }
  };

  return (
    <div className="h-full flex flex-col overflow-auto">
      <PageHeader>
        <span>Home</span>
        <div />
      </PageHeader>
      <div className="p-8 flex flex-col gap-4">
        <p>Welcome to {import.meta.env.APP_NAME}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAgentOpen(true)}
            className="gap-2"
          >
            <Bot className="size-4" />
            Create Course
          </Button>
        </div>
      </div>
      <WizardAgentDialog
        open={agentOpen}
        onOpenChange={handleOpenChange}
        context={{ contentType: "roadmap" }}
      />
    </div>
  );
}
