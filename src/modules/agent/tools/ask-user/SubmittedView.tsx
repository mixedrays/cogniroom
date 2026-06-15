import { AskUserV2ParamsSchema } from "./schema";

interface SubmittedViewProps {
  params: unknown;
  result: unknown;
}

export function AskUserV2SubmittedView({ params, result }: SubmittedViewProps) {
  const parsed = AskUserV2ParamsSchema.safeParse(params);
  if (!parsed.success) return null;

  const answers = (result ?? {}) as Record<string, string | string[]>;

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/20 px-4 py-3 text-sm space-y-2">
        {parsed.data.questions.map((q) => {
          const ans = answers[q.header];
          const ansText = Array.isArray(ans) ? ans.join(", ") : (ans ?? "—");
          return (
            <div key={q.header}>
              <p className="text-muted-foreground text-xs">{q.question}</p>
              <p className="font-medium">{ansText}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
