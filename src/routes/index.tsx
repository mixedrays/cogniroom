import { createFileRoute, useSearch } from "@tanstack/react-router";
import HomeAgentTabs from "@/components/HomeAgentTabs";

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
  const search = useSearch({ from: "/" });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <HomeAgentTabs initialSessionId={search.session} />
    </div>
  );
}
