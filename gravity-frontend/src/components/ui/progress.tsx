import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  indicatorClassName?: string;
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn(
        "relative h-3.5 w-full overflow-hidden rounded-full bg-[var(--border)] border-2 border-[var(--text)] p-[2px]",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full bg-[var(--cta)] transition-all duration-300 ease-in-out",
          indicatorClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
