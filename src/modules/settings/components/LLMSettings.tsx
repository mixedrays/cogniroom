import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "../context/SettingsContext";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  getModelPriceLabel,
} from "@/lib/llmModels";

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
          <Select
            value={settings.llm.defaultModel}
            onValueChange={(v) => v && updateLLM({ defaultModel: v })}
          >
            <SelectTrigger className="w-50 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AVAILABLE_MODELS).map(([key, model]) => (
                <SelectItem key={key} value={key} className="justify-between w-full">
                  {model.label}
                  <span className="text-muted-foreground">
                    {getModelPriceLabel(model)}
                  </span>
                  {key === DEFAULT_MODEL && "(default)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
