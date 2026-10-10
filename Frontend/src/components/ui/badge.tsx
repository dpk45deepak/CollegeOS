import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 border-[var(--text)] px-3 py-0.5 text-xs font-bold transition-all focus:outline-none shadow-[2px_2px_0_var(--text)] font-display",
  {
    variants: {
      variant: {
        default: "bg-[var(--secondary)] text-[var(--text)]",
        secondary: "bg-[var(--primary)] text-[var(--text)]",
        destructive: "bg-rose-400 text-white",
        outline: "bg-white text-[var(--text)]",
        success: "bg-[var(--accent-mint)] text-[var(--text)]",
        warning: "bg-amber-300 text-[var(--text)]",
        ai: "bg-[var(--accent-purple)] text-[var(--text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
