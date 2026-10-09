import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Failed to load information from the college server. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-destructive/20 bg-destructive/5 my-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2 text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          Retry Request
        </Button>
      )}
    </div>
  );
}
