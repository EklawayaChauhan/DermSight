import { useEffect, useState } from "react";
import { Activity, Stethoscope } from "lucide-react";

interface StartupOverlayProps {
  onComplete: () => void;
}

export function StartupOverlay({ onComplete }: StartupOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="startup-overlay fixed inset-0 z-50 flex items-center justify-center bg-background px-6">
      <div className="startup-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative flex flex-col items-center text-center">
        <div className="startup-mark relative flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-primary text-primary-foreground shadow-glow">
          <div className="absolute inset-2 rounded-[1.1rem] border border-primary-foreground/20" />
          <Stethoscope className="h-8 w-8" strokeWidth={1.8} />
          <Activity className="absolute bottom-3 right-3 h-3.5 w-3.5 text-secondary" strokeWidth={2.5} />
        </div>
        <p className="mt-7 font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">DermSight</p>
        <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <span className="startup-status-dot h-1.5 w-1.5 rounded-full bg-secondary" />
          Preparing consultation space
        </div>
        <div className="mt-6 h-px w-40 overflow-hidden bg-border">
          <span className="startup-progress block h-full w-1/2 bg-secondary" />
        </div>
      </div>
    </div>
  );
}