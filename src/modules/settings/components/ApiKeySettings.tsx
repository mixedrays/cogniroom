import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { OPENAI_API_KEY_STORAGE } from "@/modules/agent/backends/clientBackend";

export function ApiKeySettings() {
  const { settings, updateLLM } = useSettings();
  const useOwnKey = settings.llm.useOwnKey ?? false;
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(OPENAI_API_KEY_STORAGE) ?? ""
  );

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (value) {
      localStorage.setItem(OPENAI_API_KEY_STORAGE, value);
    } else {
      localStorage.removeItem(OPENAI_API_KEY_STORAGE);
    }
  };

  return (
    <div className="divide-y divide-border">
      <div className="py-4 first:pt-0">
        <FieldLabel htmlFor="use-own-key">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Use own API key</FieldTitle>
              <FieldDescription>
                Connect directly to OpenAI from the browser
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
          <div className="mt-3">
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Stored in browser localStorage only. Tool actions that require
              server access (e.g. memory) are skipped in this mode.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
