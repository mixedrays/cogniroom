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
  isFreeModel,
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
  const { availableProviderIds, isLoading } = useApiKeyAvailability();
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

  if (!hasProviders) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={disabled || isLoading}
        onClick={() => openSettings("api-key")}
        className={cn(
          "justify-between gap-1.5 font-normal text-muted-foreground",
          triggerClassName
        )}
      >
        <KeyRoundIcon className="size-3.5" />
        {isLoading ? "Loading models…" : "Add API key"}
      </Button>
    );
  }

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

        <ComboboxEmpty>No models found.</ComboboxEmpty>

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
                          {(item.model.priceRating ||
                            isFreeModel(item.model)) && (
                            <Tooltip
                              content={
                                <div className="space-y-1">
                                  <div className="font-medium text-green-500">
                                    {getModelPriceFullLabel(item.model)}
                                  </div>
                                  {item.model.price &&
                                    !isFreeModel(item.model) && (
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
                              <span
                                className={cn(
                                  "text-xs cursor-help underline decoration-dotted underline-offset-2",
                                  isFreeModel(item.model)
                                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                    : "text-green-600 dark:text-green-400"
                                )}
                              >
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

        <div className="border-t p-1">
          <Button
            onClick={() => goToSettings("llm")}
            size="sm"
            className="w-full text-muted-foreground justify-start"
            variant="ghost"
          >
            <SettingsIcon className="size-4" />
            Manage models…
          </Button>
        </div>
      </ComboboxContent>
    </Combobox>
  );
}
