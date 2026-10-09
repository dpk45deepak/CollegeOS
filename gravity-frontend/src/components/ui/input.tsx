import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative flex items-center w-full">
          <div className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none">
            {icon}
          </div>
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-2xl border-3 border-[var(--text)] bg-white pl-10 pr-4 py-2 text-sm text-[var(--text)] font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--secondary)]/60 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border-3 border-[var(--text)] bg-white px-4 py-2 text-sm text-[var(--text)] font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--secondary)]/60 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
