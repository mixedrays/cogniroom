import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
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
      <PageHeader />
      <div className="p-8 flex flex-col gap-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAgentOpen(true)}
            className="gap-2"
          >
            <Bot />
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
