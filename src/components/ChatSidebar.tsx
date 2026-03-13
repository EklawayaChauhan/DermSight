import { Plus, MessageSquare, Moon, Sun, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  dark: boolean;
  onToggleDark: () => void;
  onNewChat: () => void;
}

export function ChatSidebar({ dark, onToggleDark, onNewChat }: Props) {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground text-sm font-extrabold bg-primary shadow-soft">
            D
          </span>
          <span className="gradient-text font-extrabold tracking-tight">DermSight</span>
        </h1>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-0 font-medium"
          variant="outline"
        >
          <Plus className="w-4 h-4" /> New Consultation
        </Button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-thin">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-2 mb-2 font-semibold">
          Recent
        </p>
        {["Skin rash on arm", "Acne treatment tips", "Dry skin remedies"].map((t, i) => (
          <button
            key={i}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 flex items-center gap-2.5 mb-0.5 group"
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="truncate">{t}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          <span>Powered by AI</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDark}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {dark ? "Light Mode" : "Dark Mode"}
        </Button>
      </div>
    </aside>
  );
}
