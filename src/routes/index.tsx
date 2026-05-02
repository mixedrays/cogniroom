import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import CreateCourseModal from "@/components/CreateCourseModal";
import { WizardAgentInline } from "@/modules/wizard-agent";
import { courseHistoryQueryKey } from "@/components/CourseHistory";

interface HomeSearch {
  session?: string;
}

export const Route = createFileRoute("/")({
  component: App,
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    session: typeof search.session === "string" ? search.session : undefined,
  }),
});

function App() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const search = useSearch({ from: "/" });

  const handleCourseCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["courses"] });
    queryClient.invalidateQueries({ queryKey: courseHistoryQueryKey });
  };

  const handleSessionPersisted = (sessionId: string) => {
    navigate({ to: "/", search: { session: sessionId }, replace: true });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <WizardAgentInline
        context={{ contentType: "roadmap" }}
        initialSessionId={search.session}
        startNewSession
        onSessionPersisted={handleSessionPersisted}
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
        {({ hasMessages }) => (
          <PageHeader>
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
