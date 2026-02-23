import { Button } from "@/components/ui/button";

export interface SessionStats {
  hard: number;
  good: number;
  easy: number;
  unanswered: number;
}

const SEGMENTS = [
  { key: "hard" as const, label: "Hard", color: "#ef4444" },
  { key: "good" as const, label: "Good", color: "#eab308" },
  { key: "easy" as const, label: "Easy", color: "#22c55e" },
  { key: "unanswered" as const, label: "Skipped", color: "#6b7280" },
];

function DonutChart({ stats }: { stats: SessionStats }) {
  const total = stats.hard + stats.good + stats.easy + stats.unanswered;
  if (total === 0) return null;

  const r = 60;
  const cx = 80;
  const cy = 80;
  const sw = 20;
  const C = 2 * Math.PI * r;

  let theta = 0;
  const activeSegments = SEGMENTS.filter((s) => stats[s.key] > 0);

  return (
    <div className="relative">
      <svg viewBox="0 0 160 160" className="-rotate-90 size-44">
        {activeSegments.map((seg) => {
          const f = stats[seg.key] / total;
          const dash = f * C;
          const dashoffset = C * (1 - theta);
          theta += f;
          return (
            <circle
              key={seg.key}
              r={r}
              cx={cx}
              cy={cy}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={dashoffset}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{total}</span>
        <span className="text-muted-foreground text-xs">cards</span>
      </div>
    </div>
  );
}

interface SessionCompleteProps {
  stats: SessionStats;
  onReset: () => void;
}

export function SessionComplete({ stats, onReset }: SessionCompleteProps) {
  const activeSegments = SEGMENTS.filter((s) => stats[s.key] > 0);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <p className="text-xl font-semibold">Session complete!</p>
      <DonutChart stats={stats} />
      <div className="flex flex-col gap-2 min-w-36 text-sm">
        {activeSegments.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums">
              {stats[s.key]}
            </span>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={onReset}>
        Review again
      </Button>
    </div>
  );
}
