import { Stethoscope } from "lucide-react";

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3 animate-in fade-in duration-300">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-secondary shadow-soft">
        <Stethoscope className="w-4 h-4 text-secondary-foreground" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-md px-5 py-3 flex items-center gap-2 shadow-soft">
        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
        <span className="text-xs text-muted-foreground ml-2">Analyzing...</span>
      </div>
    </div>
  );
}
