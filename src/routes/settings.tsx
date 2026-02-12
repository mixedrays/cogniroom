import { createFileRoute } from "@tanstack/react-router";
import { SettingsContent } from "@/components/Settings";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Customize your learning platform experience
        </p>
      </div>

      <SettingsContent />
    </div>
  );
}
