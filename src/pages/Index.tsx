import { useState, useRef, useEffect, useCallback } from "react";
import { Stethoscope, ImagePlus, FileText, X, CornerRightUp, ShieldCheck, ScanLine, CircleHelp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { StartupOverlay } from "@/components/StartupOverlay";
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea";
import { streamChat, type Message } from "@/lib/chat";
import { downloadReport } from "@/lib/report";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WELCOME = "Hello! I'm **DermSight**, your AI dermatology assistant. Describe your skin concern or **upload an image** of the affected area for analysis.\n\n*Remember: I provide general information only — always consult a certified dermatologist for proper diagnosis.*";

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [startupComplete, setStartupComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 52,
    maxHeight: 200,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("skin-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("skin-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if ((!text && !pendingImage) || loading) return;

    setInput("");
    adjustHeight(true);
    setLoading(true);

    let imageUrl: string | undefined;
    let userContent: Message["content"];

    if (pendingImage) {
      setUploading(true);
      try {
        imageUrl = await uploadImage(pendingImage.file);
      } catch (e) {
        toast.error("Failed to upload image. Please try again.");
        setLoading(false);
        setUploading(false);
        return;
      }
      setUploading(false);

      const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
      parts.push({ type: "image_url", image_url: { url: imageUrl } });
      parts.push({
        type: "text",
        text: text || "Please analyze this skin image. Identify the condition, provide a detailed diagnosis, treatment recommendations, and prescription suggestions.",
      });
      userContent = parts;
      setPendingImage(null);
    } else {
      userContent = text;
    }

    const userMsg: Message = { role: "user", content: userContent, imageUrl };
    setMessages((prev) => [...prev, userMsg]);

    let assistantText = "";
    const allMessages = [...messages, userMsg];

    await streamChat({
      messages: allMessages,
      onDelta: (chunk) => {
        assistantText += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.content !== WELCOME) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantText } : m));
          }
          return [...prev, { role: "assistant", content: assistantText }];
        });
      },
      onDone: () => setLoading(false),
      onError: (err) => {
        toast.error(err);
        setLoading(false);
      },
    });
  }, [input, loading, messages, pendingImage, adjustHeight]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setPendingImage({ file, preview });
    e.target.value = "";
  };

  const newChat = () => {
    setMessages([{ role: "assistant", content: WELCOME }]);
    setInput("");
    setPendingImage(null);
  };

  const hasAssessment = messages.some((m) => m.role === "assistant" && m.content !== WELCOME);

  return (
    <div className={cn("app-shell flex h-screen w-full overflow-hidden bg-background", startupComplete && "app-shell-ready")}>
      {!startupComplete && <StartupOverlay onComplete={() => setStartupComplete(true)} />}
      <ChatSidebar dark={dark} onToggleDark={() => setDark(!dark)} onNewChat={newChat} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="workspace-header flex min-h-16 items-center justify-between gap-4 border-b border-border bg-card/80 px-5 backdrop-blur-xl sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Stethoscope className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-display text-sm font-semibold tracking-tight text-foreground sm:text-base">DermSight AI</span>
                <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">Beta</span>
              </div>
              <div className="hidden items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Consultation space ready
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary" /> Private session
            </span>
            {hasAssessment && <Button variant="outline" size="sm" onClick={() => downloadReport(messages)} className="gap-2 rounded-xl border-border bg-background/60 text-xs shadow-soft">
              <FileText className="h-4 w-4" /> <span className="hidden sm:inline">Download report</span>
            </Button>}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="workspace-content flex-1 overflow-y-auto px-4 py-5 scrollbar-thin sm:px-8 sm:py-7">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            {messages.map((m, i) => (
              <ChatMessage key={i} message={m} />
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && <ThinkingIndicator />}
          </div>
        </div>

        {/* Input Area */}
        <div className="composer-shell border-t border-border bg-card/80 px-4 pb-4 pt-3 backdrop-blur-xl sm:px-7 sm:pb-5">
          <div className="mx-auto max-w-4xl">
            {/* Pending image preview */}
            {pendingImage && (
              <div className="mb-3 relative inline-block">
                <img src={pendingImage.preview} alt="Preview" className="h-20 rounded-xl border border-border object-cover shadow-soft" />
                <button
                  onClick={() => { URL.revokeObjectURL(pendingImage.preview); setPendingImage(null); }}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="relative">
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-background/75 p-1.5 shadow-soft transition-all focus-within:border-primary/40 focus-within:shadow-glow">
                <input
                  type="file"
                  ref={fileRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileRef.current?.click()}
                  disabled={loading}
                  className="h-10 w-10 flex-shrink-0 rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  title="Upload skin image"
                >
                  <ImagePlus className="w-5 h-5" />
                </Button>

                <div className="relative flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      adjustHeight();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={pendingImage ? "Add a description (optional)..." : "Describe your skin concern..."}
                    disabled={loading}
                    className={cn(
                      "min-h-[48px] resize-none rounded-xl border-0 bg-transparent py-3 pl-3 pr-12 text-sm shadow-none",
                      "focus-visible:ring-primary/30 focus-visible:ring-offset-0",
                      "placeholder:text-muted-foreground/60",
                      "transition-all duration-200"
                    )}
                  />
                  <button
                    onClick={send}
                    disabled={(!input.trim() && !pendingImage) || loading}
                     className={cn(
                       "absolute bottom-2.5 right-2.5 rounded-xl p-2 transition-all duration-200",
                      loading
                        ? "bg-transparent"
                        : input.trim() || pendingImage
                          ? "bg-primary text-primary-foreground shadow-soft hover:shadow-glow"
                       "bg-muted text-muted-foreground"
                    )}
                    type="button"
                  >
                    {loading ? (
                      <div
                        className="w-4 h-4 rounded-sm bg-primary animate-spin"
                        style={{ animationDuration: "3s" }}
                      />
                    ) : (
                      <CornerRightUp className={cn(
                        "w-4 h-4 transition-opacity",
                        (input.trim() || pendingImage) ? "opacity-100" : "opacity-40"
                      )} />
                    )}
                  </button>
                </div>
              </div>

             <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] font-medium text-muted-foreground/70">
                {loading ? <><ScanLine className="h-3 w-3 text-secondary" /> AI is reviewing your message...</> : <><CircleHelp className="h-3 w-3" /> General information only — not medical advice.</>}
              </p>
            </div>
          </div>
        </div>
      </main>

      <aside className="hidden w-72 flex-shrink-0 flex-col gap-5 border-l border-border bg-sidebar/25 p-5 xl:flex">
        <div className="border-b border-border pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Session overview</p>
          <h2 className="mt-2 font-display text-lg font-semibold tracking-tight text-foreground">A calmer way to start</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Share a concern in your own words or add a clear image for general guidance.</p>
        </div>
        <div className="space-y-3">
          <div className="status-rail-item flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><ImagePlus className="h-4 w-4" /></div>
            <div><p className="text-xs font-semibold text-foreground">Image check</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Good lighting and a close view help the model respond clearly.</p></div>
          </div>
          <div className="status-rail-item flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-4 w-4" /></div>
            <div><p className="text-xs font-semibold text-foreground">Privacy first</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Your consultation stays focused on the information you provide.</p></div>
          </div>
        </div>
        <div className="mt-auto rounded-2xl bg-primary p-4 text-primary-foreground shadow-glow">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-secondary" /><p className="text-xs font-semibold">Ready when you are</p></div>
          <p className="mt-2 text-[11px] leading-relaxed text-primary-foreground/75">Start with what changed, where it is, and how long you have noticed it.</p>
        </div>
      </aside>
    </div>
  );
}
