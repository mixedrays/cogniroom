import { useSettings } from "../context/SettingsContext";
import { AVAILABLE_MODELS } from "@/lib/llmModels";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";

export function LLMSettings() {
  const { settings, updateLLM } = useSettings();

  return (
    <div className="divide-y divide-border">
      {/* Default Model */}
      <div className="py-4 first:pt-0">
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

      {/* Pricing Reference */}
      <div className="py-4">
        <p className="font-medium mb-3">Pricing reference</p>
        <p className="text-sm text-muted-foreground mb-3">Cost per 1M tokens</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-1.5 pr-4 font-medium">Model</th>
                <th className="text-right py-1.5 px-4 font-medium">Input</th>
                <th className="text-right py-1.5 pl-4 font-medium">Output</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(AVAILABLE_MODELS).map(([key, model]) => (
                <tr key={key} className="border-b border-border/50">
                  <td className="py-1.5 pr-4">{model.label}</td>
                  <td className="text-right py-1.5 px-4 text-muted-foreground">
                    ${(model.price.input * 1000000).toFixed(2)}
                  </td>
                  <td className="text-right py-1.5 pl-4 text-muted-foreground">
                    ${(model.price.output * 1000000).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
