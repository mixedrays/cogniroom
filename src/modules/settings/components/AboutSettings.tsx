import { ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const REPO_URL = "https://github.com/mixedrays/cogniroom";
const buildVersion = `${APP_VERSION}-${APP_COMMIT_HASH}`;

export function AboutSettings() {
  return (
    <div>
      <div className="mb-4">
        <p className="font-medium">About</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Application version and project details
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="text-lg font-semibold">CogniRoom</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            A platform for creating, managing, and tracking skill learning
            roadmaps. Generate roadmaps, lessons, tests, and exercises with LLMs,
            or import them from external sources, then track your progress.
          </p>
        </div>

        <div className="rounded-lg border divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="font-mono text-sm">{APP_VERSION}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-muted-foreground">Commit</span>
            <span className="font-mono text-sm">{APP_COMMIT_HASH}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-muted-foreground">Build</span>
            <span className="font-mono text-sm">{buildVersion}</span>
          </div>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            render={
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                View on GitHub
                <ExternalLinkIcon />
              </a>
            }
          />
        </div>
      </div>
    </div>
  );
}
