import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="h-full flex flex-col overflow-auto">
      <PageHeader>
        <span>Home</span>
        <div />
      </PageHeader>
      <div className="p-8">Welcome to {import.meta.env.APP_NAME}</div>
    </div>
  );
}
