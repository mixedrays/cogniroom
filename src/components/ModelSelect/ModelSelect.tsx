import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  DEFAULT_MODEL,
  providers,
  getModelPriceLabel,
  getModelPriceFullLabel,
  formatPricePerMillion,
  getModelLabel,
} from "@/lib/llm-models";
import type { ModelStats } from "@/lib/llm-models";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { cn } from "@/lib/utils";
import { useSettings } from "@/modules/settings/context/SettingsContext";
import { useApiKeyAvailability } from "@/modules/settings/hooks/useApiKeyAvailability";
import { useSettingsSearch } from "@/modules/settings";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SettingsIcon, KeyRoundIcon } from "lucide-react";

type ModelItem = {
  id: string;
  providerId: string;
  providerName: string;
  model: ModelStats;
};

type ModelSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  showDefault?: boolean;
  triggerClassName?: string;
};

export function ModelSelect({
  value,
  onValueChange,
  disabled,
  className,
  showDefault = false,
  triggerClassName,
}: ModelSelectProps) {
  const { settings } = useSettings();
  const { availableProviderIds } = useApiKeyAvailability();
  const { open: openSettings } = useSettingsSearch();
  const [open, setOpen] = useState(false);

  const groupedItems = useMemo(() => {
    const hiddenModels = settings.llm.hiddenModels ?? [];
    return providers
      .filter((provider) => availableProviderIds.has(provider.id))
      .map((provider) => ({
        value: provider.id,
        label: provider.name,
        items: Object.entries(provider.models)
          .filter(([key]) => !hiddenModels.includes(key))
          .map(
            ([key, model]): ModelItem => ({
              id: key,
              providerId: provider.id,
              providerName: provider.name,
              model,
            })
          ),
      }))
      .filter((group) => group.items.length > 0);
  }, [settings.llm.hiddenModels, availableProviderIds]);

  const allItems = useMemo(
    () => groupedItems.flatMap((g) => g.items),
    [groupedItems]
  );

  const selectedItem = allItems.find((item) => item.id === value) ?? null;
  const hasProviders = availableProviderIds.size > 0;

  const goToSettings = (path: string) => {
    setOpen(false);
    openSettings(path);
  };

  return (
    <Combobox<ModelItem>
      open={open}
      onOpenChange={setOpen}
      value={selectedItem}
      onValueChange={(item) => {
        if (item) onValueChange(item.id);
      }}
      disabled={disabled}
      items={groupedItems}
      itemToStringLabel={(item) => item.model.label}
      isItemEqualToValue={(a, b) => a.id === b.id}
      filter={(item, query) => {
        const q = query.toLowerCase();
        return (
          item.model.label.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.providerName.toLowerCase().includes(q)
        );
      }}
    >
      <ComboboxTrigger
        render={
          <Button
            variant="outline"
            className={cn("justify-between font-normal", triggerClassName)}
          />
        }
      >
        <ComboboxValue placeholder="Select model">
          {getModelLabel(value)}
        </ComboboxValue>
      </ComboboxTrigger>

      <ComboboxContent className={cn("w-auto", className)}>
        <ComboboxInput showTrigger={false} placeholder="Search models..." />

        <ComboboxEmpty>
          {hasProviders ? (
            "No models found."
          ) : (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => goToSettings("api-key")}
              className="flex w-full flex-col items-center gap-1 px-3 py-3 text-center hover:bg-accent rounded-sm"
            >
              <span className="text-sm font-medium text-foreground">
                No models available
              </span>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <KeyRoundIcon className="size-3" />
                Add an API key in Settings
              </span>
            </button>
          )}
        </ComboboxEmpty>

        <ComboboxList>
          <ComboboxCollection>
            {(group, groupIndex) => (
              <ComboboxGroup key={group.value as string} items={group.items}>
                {groupIndex > 0 && <ComboboxSeparator />}
                <ComboboxLabel>{group.label}</ComboboxLabel>
                <ComboboxCollection>
                  {(item: ModelItem) => (
                    <ComboboxItem key={item.id} value={item}>
                      <div className="flex flex-col gap-1">
                        <span>
                          {item.model.label}{" "}
                          {item.model.priceRating && (
                            <Tooltip
                              content={
                                <div className="space-y-1">
                                  <div className="font-medium text-green-500">
                                    {getModelPriceFullLabel(item.model)}
                                  </div>
                                  {item.model.price && (
                                    <>
                                      <div>
                                        Input:{" "}
                                        {formatPricePerMillion(
                                          item.model.price.input
                                        )}{" "}
                                        / 1M tokens
                                      </div>
                                      <div>
                                        Output:{" "}
                                        {formatPricePerMillion(
                                          item.model.price.output
                                        )}{" "}
                                        / 1M tokens
                                      </div>
                                    </>
                                  )}
                                </div>
                              }
                            >
                              <span className="text-xs text-green-600 dark:text-green-400 cursor-help underline decoration-dotted underline-offset-2">
                                {getModelPriceLabel(item.model)}
                              </span>
                            </Tooltip>
                          )}
                          {showDefault && item.id === DEFAULT_MODEL && (
                            <span> (default)</span>
                          )}
                        </span>

                        {item.model.hint && (
                          <span className="text-xs text-muted-foreground block">
                            {item.model.hint}
                          </span>
                        )}
                      </div>
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxCollection>
        </ComboboxList>

        {hasProviders && (
          <div className="border-t p-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => goToSettings("llm")}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <SettingsIcon className="size-4" />
              <span>Manage models…</span>
            </button>
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
