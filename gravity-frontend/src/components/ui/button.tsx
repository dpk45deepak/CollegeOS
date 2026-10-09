import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta)] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer font-display",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--cta)] text-white border-3 border-[var(--text)] shadow-[4px_4px_0_var(--text)] hover:shadow-[2px_2px_0_var(--text)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        destructive:
          "bg-rose-500 text-white border-3 border-[var(--text)] shadow-[4px_4px_0_var(--text)] hover:shadow-[2px_2px_0_var(--text)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none",
        outline:
          "bg-white text-[var(--text)] border-3 border-[var(--text)] shadow-[3px_3px_0_var(--text)] hover:shadow-[1px_1px_0_var(--text)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none",
        secondary:
          "bg-[var(--secondary)] text-[var(--text)] border-3 border-[var(--text)] shadow-[4px_4px_0_var(--text)] hover:shadow-[2px_2px_0_var(--text)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none",
        peach:
          "bg-[var(--primary)] text-[var(--text)] border-3 border-[var(--text)] shadow-[4px_4px_0_var(--text)] hover:shadow-[2px_2px_0_var(--text)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none",
        purple:
          "bg-[var(--accent-purple)] text-[var(--text)] border-3 border-[var(--text)] shadow-[4px_4px_0_var(--text)] hover:shadow-[2px_2px_0_var(--text)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none",
        mint:
          "bg-[var(--accent-mint)] text-[var(--text)] border-3 border-[var(--text)] shadow-[4px_4px_0_var(--text)] hover:shadow-[2px_2px_0_var(--text)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none",
        ghost:
          "text-[var(--text)] hover:bg-[var(--secondary)]/30 hover:text-[var(--text)] rounded-xl border-2 border-transparent hover:border-[var(--text)]",
        link: "text-[var(--cta-dark)] underline-offset-4 hover:underline",
        subtle:
          "bg-white/70 text-[var(--text)] hover:bg-white rounded-xl border-2 border-[var(--text)]",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-2xl",
        sm: "h-8 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-2xl px-7 text-base font-bold",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
