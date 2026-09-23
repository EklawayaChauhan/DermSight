import { Plus, MessageSquare, Moon, Sun, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  dark: boolean;
  onToggleDark: () => void;
  onNewChat: () => void;
}

export function ChatSidebar({ dark, onToggleDark, onNewChat }: Props) {
  return (
    <aside className="hidden w-64 flex-shrink-0 bg-sidebar/65 md:flex md:flex-col md:border-r md:border-sidebar-border">
      {/* Logo */}
      <div className="border-b border-sidebar-border p-5">
        <h1 className="flex items-center gap-3 text-lg font-bold text-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground shadow-glow">D</span>
          <span className="font-display tracking-tight">DermSight</span>
        </h1>
        <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"><Activity className="h-3.5 w-3.5 text-secondary" /> Neural engine online</div>
      </div>

      {/* New Chat */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="h-11 w-full justify-start gap-2 rounded-xl border-0 bg-primary/10 font-medium text-primary hover:bg-primary/20"
          variant="outline"
        >
          <Plus className="w-4 h-4" /> New Consultation
        </Button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-4 scrollbar-thin">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Recent
        </p>
        {["Skin rash on arm", "Acne treatment tips", "Dry skin remedies"].map((t, i) => (
          <Button
            variant="ghost"
            size="sm"
            key={i}
            className="group mb-1 h-auto w-full justify-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-normal text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="truncate">{t}</span>
          </Button>
        ))}
      </div>

      {/* Footer */}
      <div className="space-y-1 border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          <span>Powered by AI</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDark}
          className="w-full justify-start gap-2 rounded-xl text-muted-foreground hover:text-foreground"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {dark ? "Light Mode" : "Dark Mode"}
        </Button>
      </div>
    </aside>
  );
}
