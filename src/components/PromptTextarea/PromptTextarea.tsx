import { useState } from "react";
import { ArrowUp, Loader2, Plus, Square, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip.adapter";
import { useSettings } from "@/modules/settings/context/SettingsContext";
import { getValidModel } from "@/lib/llm-models";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export type PromptAttachmentOption = {
  id: string;
  label: string;
};

type PromptTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string, model: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
  autoFocus?: boolean;
  attachments?: PromptAttachmentOption[];
  availableAttachments?: PromptAttachmentOption[];
  onAttachmentRemove?: (id: string) => void;
  onAttachmentAdd?: (id: string) => void;
  textareaId?: string;
};

export function PromptTextarea({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  isStreaming = false,
  onStop,
  autoFocus = false,
  attachments,
  availableAttachments,
  onAttachmentRemove,
  onAttachmentAdd,
  textareaId,
}: PromptTextareaProps) {
  const { settings } = useSettings();
  const online = useOnlineStatus();
  const [selectedModel, setSelectedModel] = useState(() =>
    getValidModel(settings.llm.defaultModel)
  );

  const handleSubmit = () => {
    const text = value.trim();
    if (!text || disabled || !online) return;
    onSubmit(text, selectedModel);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isStreaming) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSendDisabled = disabled || !value.trim() || !online;
  const isInputDisabled = disabled || isStreaming;

  const activeAttachments = attachments ?? [];
  const selectedIds = new Set(activeAttachments.map((a) => a.id));
  const addableAttachments = (availableAttachments ?? []).filter(
    (a) => !selectedIds.has(a.id)
  );
  const showAddButton = !!onAttachmentAdd && addableAttachments.length > 0;

  return (
    <div
      className={cn(
        "border rounded-lg bg-primary-foreground transition-[border-color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
      )}
    >
      {activeAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2 pt-2">
          {activeAttachments.map((a) => (
            <Tooltip
              key={a.id}
              content={`${a.label} is attached as context for the AI. Click × to remove.`}
            >
              <Badge variant="outline" className="pl-0!">
                {onAttachmentRemove ? (
                  <button
                    type="button"
                    data-icon="inline-start"
                    onClick={() => onAttachmentRemove(a.id)}
                    aria-label={`Remove attachment ${a.label}`}
                    className="p-1 cursor-pointer rounded-full hover:bg-muted"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
                <span className="truncate max-w-50">{a.label}</span>
              </Badge>
            </Tooltip>
          ))}
        </div>
      )}

      <textarea
        id={textareaId}
        className="w-full resize-none px-3 pt-3 pb-2 text-sm outline-none placeholder:text-muted-foreground field-sizing-content focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isInputDisabled}
        autoFocus={autoFocus}
      />
      <div className="flex items-center gap-1 px-2 pb-2">
        {showAddButton && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={isInputDisabled}
                  aria-label="Add attachment"
                >
                  <Plus />
                </Button>
              }
            />
            <DropdownMenuContent align="start">
              {addableAttachments.map((a) => (
                <DropdownMenuItem
                  key={a.id}
                  onClick={() => onAttachmentAdd?.(a.id)}
                >
                  {a.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <ModelSelect
          value={selectedModel}
          onValueChange={setSelectedModel}
          disabled={isInputDisabled}
          triggerClassName="border-0 shadow-none hover:bg-accent transition-colors"
        />

        <div className="ml-auto">
          {isStreaming ? (
            <Button
              size="icon"
              onClick={onStop}
              aria-label="Stop"
              variant="secondary"
            >
              <Square className="size-3 fill-current" />
            </Button>
          ) : (
            (() => {
              const sendButton = (
                <Button
                  size="icon"
                  onClick={handleSubmit}
                  disabled={isSendDisabled}
                  aria-label={
                    !online ? "Offline" : disabled ? "Sending..." : "Send"
                  }
                >
                  {disabled ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowUp className="size-4" />
                  )}
                </Button>
              );
              return !online ? (
                <Tooltip content="You are offline">{sendButton}</Tooltip>
              ) : (
                sendButton
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
