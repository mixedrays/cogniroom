import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Wand2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { WizardDialog } from "@/modules/wizard";
import { generateCourse, saveCourse } from "@/lib/courses";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleGenerate = async (prompt: string) => {
    const result = await generateCourse({
      topic: prompt,
      level: "beginner",
      model: "gpt-4o-mini",
    });
    if (result.success && result.course) {
      await saveCourse(result.course);
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    }
    setWizardOpen(false);
  };

  return (
    <div className="h-full flex flex-col overflow-auto">
      <PageHeader>
        <span>Home</span>
        <div />
      </PageHeader>
      <div className="p-8 flex flex-col gap-4">
        <p>Welcome to {import.meta.env.APP_NAME}</p>
        <div>
          <Button
            variant="outline"
            onClick={() => setWizardOpen(true)}
            className="gap-2"
          >
            <Wand2 className="size-4" />
            AI Wizard
          </Button>
        </div>
      </div>
      <WizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        context={{ contentType: "roadmap" }}
        onGenerate={handleGenerate}
      />
    </div>
  );
}
