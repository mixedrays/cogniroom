import { Loader2 } from "lucide-react";
import type { WizardMessage as WizardMessageType } from "../types";
import type { AgentMessage } from "../schema";
import { RadioWidget } from "./widgets/RadioWidget";
import { CheckboxWidget } from "./widgets/CheckboxWidget";
import { SliderWidget } from "./widgets/SliderWidget";
import { TextInputWidget } from "./widgets/TextInputWidget";
import { PreviewWidget } from "./widgets/PreviewWidget";
import { QuestionsBatchWidget } from "./widgets/QuestionsBatchWidget";

interface WizardMessageProps {
  message: WizardMessageType;
  isAnswered: boolean;
  onWidgetAnswer: (widget: AgentMessage, answer: unknown) => void;
  onBatchSubmit: (
    widget: Extract<AgentMessage, { type: "questions" }>,
    widgetId: string,
    answers: Record<string, string | string[]>
  ) => void;
  onDismissWidget: (widgetId: string) => void;
}

export function WizardMessage({
  message,
  isAnswered,
  onWidgetAnswer,
  onBatchSubmit,
  onDismissWidget,
}: WizardMessageProps) {
  if (message.role === "user") {
    if (message.sourceWidget?.type === "questions") {
      const answers = JSON.parse(message.text) as Record<
        string,
        string | string[]
      >;
      return (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-muted px-4 py-3 text-sm space-y-2">
            {message.sourceWidget.questions.map((q) => {
              const answer = answers[q.header];
              const answerText = Array.isArray(answer)
                ? answer.join(", ") || "—"
                : answer || "—";
              return (
                <div key={q.header}>
                  <p className="text-muted-foreground text-xs">{q.question}</p>
                  <p className="font-semibold">{answerText}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.status === "streaming") {
    return (
      <div className="flex justify-start">
        <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground text-xs">Thinking…</span>
        </div>
      </div>
    );
  }

  const { data } = message;

  if (data.type === "text") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
          {data.value}
        </div>
      </div>
    );
  }

  if (data.type === "preview") {
    return (
      <div className="flex justify-start w-full">
        <div className="w-full rounded-2xl rounded-tl-sm bg-muted p-4">
          <PreviewWidget data={data} />
        </div>
      </div>
    );
  }

  if (data.type === "questions") {
    return (
      <div className="flex justify-start w-full">
        <div className="w-full rounded-2xl rounded-tl-sm bg-muted p-4">
          <QuestionsBatchWidget
            data={data}
            widgetId={message.id}
            onSubmit={(answers) => onBatchSubmit(data, message.id, answers)}
            onDismiss={() => onDismissWidget(message.id)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start w-full">
      <div className="w-full rounded-2xl rounded-tl-sm bg-muted p-4">
        {data.type === "radio" && (
          <RadioWidget
            data={data}
            disabled={isAnswered}
            onAnswer={(text, raw) => onWidgetAnswer(data, raw ?? text)}
          />
        )}
        {data.type === "checkbox" && (
          <CheckboxWidget
            data={data}
            disabled={isAnswered}
            onAnswer={(text, raw) => onWidgetAnswer(data, raw ?? text)}
          />
        )}
        {data.type === "slider" && (
          <SliderWidget
            data={data}
            disabled={isAnswered}
            onAnswer={(text, raw) => onWidgetAnswer(data, raw ?? text)}
          />
        )}
        {data.type === "text_input" && (
          <TextInputWidget
            data={data}
            disabled={isAnswered}
            onAnswer={(text, raw) => onWidgetAnswer(data, raw ?? text)}
          />
        )}
      </div>
    </div>
  );
}
