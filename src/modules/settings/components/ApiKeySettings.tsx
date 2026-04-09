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
import { Trash2 } from "lucide-react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  OPENAI_API_KEY_STORAGE,
  ANTHROPIC_API_KEY_STORAGE,
} from "@/modules/agent/backends/clientBackend";

function ApiKeyField({
  label,
  placeholder,
  storageKey,
  deleteDescription,
}: {
  label: string;
  placeholder: string;
  storageKey: string;
  deleteDescription: string;
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
  };

  const handleDeleteKey = () => {
    setApiKey("");
    localStorage.removeItem(storageKey);
  };

  return (
    <div>
      <p className="text-sm font-medium mb-1.5">{label}</p>
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
    </div>
  );
}

export function ApiKeySettings() {
  const { settings, updateLLM } = useSettings();
  const useOwnKey = settings.llm.useOwnKey ?? false;

  return (
    <div className="divide-y divide-border">
      <div className="py-4 first:pt-0">
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
          <div className="mt-3 space-y-3">
            <ApiKeyField
              label="OpenAI"
              placeholder="sk-..."
              storageKey={OPENAI_API_KEY_STORAGE}
              deleteDescription="This will remove your saved OpenAI API key."
            />
            <ApiKeyField
              label="Anthropic"
              placeholder="sk-ant-..."
              storageKey={ANTHROPIC_API_KEY_STORAGE}
              deleteDescription="This will remove your saved Anthropic API key."
            />
            <p className="text-xs text-muted-foreground">
              Stored in browser localStorage only. Tool actions that require
              server access (e.g. memory) are skipped in this mode.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
