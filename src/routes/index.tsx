import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import CreateCourseModal from "@/components/CreateCourseModal";
import { WizardAgentInline } from "@/modules/wizard-agent";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const queryClient = useQueryClient();

  const handleCourseCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <WizardAgentInline
        context={{ contentType: "roadmap" }}
        welcomeTitle="What do you want to learn?"
        placeholder="Describe the course you want to create…"
        className="max-w-3xl w-full mx-auto"
        promptExtra={
          <CreateCourseModal
            onCreated={handleCourseCreated}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <Zap className="size-3.5" />
                Quick Create
              </Button>
            }
          />
        }
      >
        {({ hasMessages, onClear }) => (
          <PageHeader
            actions={
              hasMessages ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={onClear}
                  aria-label="Clear conversation"
                >
                  <RotateCcw />
                </Button>
              ) : undefined
            }
          >
            {hasMessages && (
              <div className="flex items-center gap-2">
                <Bot className="size-4" />
                <span className="font-medium">Create Course</span>
              </div>
            )}
          </PageHeader>
        )}
      </WizardAgentInline>
    </div>
  );
}
