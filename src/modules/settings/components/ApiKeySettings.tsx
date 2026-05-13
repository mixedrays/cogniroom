import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, CheckCircle2, ShieldAlert, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { providers, getProviderLocalStorageKeyName } from "@/lib/llm-models";
import {
  useApiKeyAvailability,
  type ProviderApiKeyAvailability,
} from "../hooks/useApiKeyAvailability";

function ApiKeyField({
  label,
  placeholder,
  storageKey,
  deleteDescription,
  availability,
  onLocalChanged,
}: {
  label: string;
  placeholder: string;
  storageKey: string;
  deleteDescription: string;
  availability: ProviderApiKeyAvailability | undefined;
  onLocalChanged: () => void;
}) {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(storageKey) ?? ""
  );

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (value) {
      localStorage.setItem(storageKey, value);
    } else {
      localStorage.removeItem(storageKey);
    }
    onLocalChanged();
  };

  const handleDeleteKey = () => {
    setApiKey("");
    localStorage.removeItem(storageKey);
    onLocalChanged();
  };

  const hasEnvKey = availability?.hasEnvKey ?? false;
  const envName = availability?.envName;
  const envLastChars = availability?.envLastChars;
  const hasLocalKey = apiKey.trim().length > 0;
  const localOverridesEnv = hasEnvKey && hasLocalKey;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium">{label}</p>
        {hasEnvKey && (
          <span
            className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            title={`Set via environment variable ${envName}`}
          >
            <CheckCircle2 className="size-3" />
            ENV
            {envLastChars && (
              <span className="font-mono opacity-80">…{envLastChars}</span>
            )}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <Input
          type="password"
          placeholder={placeholder}
          value={apiKey}
          onChange={(e) => handleApiKeyChange(e.target.value)}
        />
        {apiKey && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="destructive" size="icon">
                  <Trash2 />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete API key?</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDeleteKey}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      {hasEnvKey && (
        <p className="text-xs text-muted-foreground mt-1">
          {localOverridesEnv
            ? `Browser key overrides ${envName}.`
            : `Using ${envName} from environment.`}
        </p>
      )}
    </div>
  );
}

function EnvKeySummary({
  availability,
}: {
  availability: ProviderApiKeyAvailability[];
}) {
  const setEntries = availability.filter((entry) => entry.hasEnvKey);
  if (setEntries.length === 0) return null;

  return (
    <div data-settings-section="env-keys" className="py-4 first:pt-0">
      <div className="flex items-start gap-2 mb-2">
        {/* <KeyRound className="size-4 mt-0.5 text-muted-foreground" /> */}
        <div>
          <p className="font-medium">Environment API keys</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Detected on the server. Browser keys (below) take priority when set.
          </p>
        </div>
      </div>
      <div className="space-y-1">
        {setEntries.map((entry) => (
          <div
            key={entry.providerId}
            className="flex items-center justify-between text-sm border rounded-md px-2.5 py-1.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium">{entry.providerName}</span>
              <span className="font-mono text-xs text-muted-foreground truncate">
                {entry.envName}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              Set
              {entry.envLastChars && (
                <span className="font-mono opacity-80">
                  …{entry.envLastChars}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrowserKeyDisclaimer() {
  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
      <div className="flex items-start gap-2">
        <ShieldAlert className="size-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Browser-stored keys carry risk
          </p>
          <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mt-0.5">
            Keys are saved in this browser's localStorage. Tool actions that
            require server access (e.g. memory) are skipped in this mode.
          </p>
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-amber-500/60 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
                >
                  <AlertTriangle className="size-3.5 mr-1.5" />
                  Read security disclaimer
                </Button>
              }
            />
            <DialogContent className="max-w-3xl sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400" />
                  About browser-stored API keys
                </DialogTitle>
                <DialogDescription>
                  Read this before pasting a provider key into the browser.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <section>
                  <h3 className="font-medium mb-1">How keys are stored</h3>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>
                      Saved in this browser's <code>localStorage</code> in plain
                      text under keys like <code>openai_api_key</code>.
                    </li>
                    <li>
                      Never sent to this app's server — requests go directly
                      from your browser to the provider's API.
                    </li>
                    <li>
                      Persisted across reloads on this device and browser
                      profile until you delete them.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-medium mb-1">Risks</h3>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>
                      Any script on this origin (including malicious browser
                      extensions) can read <code>localStorage</code>.
                    </li>
                    <li>A successful XSS on this app would expose the key.</li>
                    <li>
                      Anyone with physical access to this browser profile can
                      read or exfiltrate the key.
                    </li>
                    <li>
                      Syncing/backup tools that copy browser profiles may
                      replicate the key elsewhere.
                    </li>
                    <li>
                      A leaked key can be used until you rotate it — billing
                      goes to your provider account.
                    </li>
                  </ul>
                </section>

                <section className="sm:col-span-2">
                  <h3 className="font-medium mb-1">Minimize the risk</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>
                      <strong>Set a hard spend limit</strong> on the provider
                      account (e.g. $5–$20) before issuing the key.
                    </li>
                    <li>
                      <strong>Create a dedicated, scoped key</strong> for this
                      app — don't reuse a production key.
                    </li>
                    <li>
                      Restrict the key to the minimum permissions / models your
                      provider supports.
                    </li>
                    <li>
                      <strong>Rotate</strong> the key regularly, and revoke
                      immediately if you suspect exposure.
                    </li>
                    <li>
                      Use this mode only on a trusted device and browser profile
                      — avoid shared or public machines.
                    </li>
                    <li>
                      Audit installed browser extensions; remove anything you
                      don't fully trust.
                    </li>
                    <li>
                      Prefer the server-side mode (env vars on the server)
                      whenever possible — keys never reach the browser there.
                    </li>
                    <li>
                      When done, click the trash icon next to a key to remove it
                      from this browser.
                    </li>
                  </ul>
                </section>

                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  You are responsible for charges incurred by any key you enter
                  here.
                </p>
              </div>

              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline">Close</Button>}
                />
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

const PROVIDER_PLACEHOLDERS: Record<string, string> = {
  openai: "sk-...",
  anthropic: "sk-ant-...",
};

export function ApiKeySettings() {
  const { settings, updateLLM } = useSettings();
  const useOwnKey = settings.llm.useOwnKey ?? false;
  const { availability, refreshLocal } = useApiKeyAvailability();
  const availabilityById = new Map(availability.map((a) => [a.providerId, a]));

  return (
    <div className="divide-y divide-border">
      <EnvKeySummary availability={availability} />

      <div data-settings-section="api-keys" className="py-4">
        <FieldLabel htmlFor="use-own-key">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Use own API keys</FieldTitle>
              <FieldDescription>
                Connect directly to LLM providers from the browser
              </FieldDescription>
            </FieldContent>
            <Switch
              id="use-own-key"
              checked={useOwnKey}
              onCheckedChange={(checked) => updateLLM({ useOwnKey: checked })}
            />
          </Field>
        </FieldLabel>

        {useOwnKey && (
          <div className="mt-6 space-y-6">
            <BrowserKeyDisclaimer />
            {providers.map((provider) => (
              <ApiKeyField
                key={provider.id}
                label={provider.name}
                placeholder={PROVIDER_PLACEHOLDERS[provider.id] ?? "sk-..."}
                storageKey={getProviderLocalStorageKeyName(provider.id)}
                deleteDescription={`This will remove your saved ${provider.name} API key.`}
                availability={availabilityById.get(provider.id)}
                onLocalChanged={refreshLocal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
