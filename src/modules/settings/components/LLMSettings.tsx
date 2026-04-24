import { useSettings } from "../context/SettingsContext";
import { providers } from "@/lib/llm-models";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import { EyeIcon, EyeOffIcon, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { cn } from "@/lib/utils";
import { useApiKeyAvailability } from "../hooks/useApiKeyAvailability";

export function LLMSettings() {
  const { settings, updateLLM } = useSettings();
  const hiddenModels = settings.llm.hiddenModels ?? [];
  const { availableProviderIds, isLoading } = useApiKeyAvailability();

  const visibleProviders = providers.filter((p) =>
    availableProviderIds.has(p.id)
  );
  const hiddenProviders = providers.filter(
    (p) => !availableProviderIds.has(p.id)
  );

  const toggleModelVisibility = (modelKey: string) => {
    const isHidden = hiddenModels.includes(modelKey);
    const updated = isHidden
      ? hiddenModels.filter((k) => k !== modelKey)
      : [...hiddenModels, modelKey];
    updateLLM({ hiddenModels: updated });
  };

  return (
    <div className="divide-y divide-border">
      {/* Default Model */}
      <div data-settings-section="default-model" className="py-4 first:pt-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Default model</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Used for generating courses, lessons, and tests
            </p>
          </div>
          <ModelSelect
            value={settings.llm.defaultModel}
            onValueChange={(v) => updateLLM({ defaultModel: v })}
            triggerClassName="w-50"
            showDefault
          />
        </div>
      </div>

      {/* Available Models */}
      <div data-settings-section="available-models" className="py-4">
        <p className="font-medium mb-3">Available models</p>
        <p className="text-sm text-muted-foreground mb-3">
          Toggle visibility in model selector. Cost per 1M tokens. Only
          providers with an API key (env or browser) are listed.
        </p>
        {!isLoading && visibleProviders.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-md">
            <KeyRound className="size-5 mx-auto mb-2 opacity-50" />
            No API keys detected. Add a key in the API Keys tab to enable models.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium w-8" />
                  <th className="text-left py-1.5 pr-4 font-medium">Model</th>
                  <th className="text-right py-1.5 px-4 font-medium">Input</th>
                  <th className="text-right py-1.5 pl-4 font-medium">Output</th>
                </tr>
              </thead>
              {visibleProviders.map((provider) => (
                <tbody key={provider.id}>
                  <tr>
                    <td
                      colSpan={4}
                      className="pt-4 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {provider.name}
                    </td>
                  </tr>
                  {Object.entries(provider.models).map(([key, model]) => {
                    const isHidden = hiddenModels.includes(key);
                    return (
                      <tr key={key} className="border-b border-border/50">
                        <td className="py-1.5 pr-2">
                          <Tooltip content={isHidden ? "Show in selector" : "Hide from selector"}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleModelVisibility(key)}
                            >
                              {isHidden ? <EyeOffIcon /> : <EyeIcon />}
                            </Button>
                          </Tooltip>
                        </td>
                        <td
                          className={cn(
                            "py-1.5 pr-4",
                            isHidden && "text-muted-foreground line-through"
                          )}
                        >
                          {model.label}
                        </td>
                        <td className="text-right py-1.5 px-4 text-muted-foreground">
                          ${(model.price.input * 1000000).toFixed(2)}
                        </td>
                        <td className="text-right py-1.5 pl-4 text-muted-foreground">
                          ${(model.price.output * 1000000).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
        )}
        {hiddenProviders.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            Hidden (no API key):{" "}
            {hiddenProviders.map((p) => p.name).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
