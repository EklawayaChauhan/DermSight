import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Stethoscope, ImagePlus, FileText, X, CornerRightUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
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
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ChatSidebar dark={dark} onToggleDark={() => setDark(!dark)} onNewChat={newChat} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/80 glass-effect">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">DermSight AI</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">Beta</span>
          </div>
          {hasAssessment && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadReport(messages)}
              className="gap-2 shadow-soft hover:shadow-glow transition-shadow"
            >
              <FileText className="w-4 h-4" />
              Download Report
            </Button>
          )}
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
          {messages.map((m, i) => (
            <ChatMessage key={i} message={m} />
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && <ThinkingIndicator />}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card/80 glass-effect p-4">
          <div className="max-w-3xl mx-auto">
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
              <div className="flex items-end gap-2">
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
                  className="rounded-xl h-11 w-11 flex-shrink-0 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
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
                      "resize-none rounded-2xl border-input bg-background pr-12 py-3.5 pl-4 text-sm",
                      "focus-visible:ring-primary/30 focus-visible:ring-offset-0",
                      "placeholder:text-muted-foreground/60",
                      "min-h-[52px] transition-all duration-200"
                    )}
                  />
                  <button
                    onClick={send}
                    disabled={(!input.trim() && !pendingImage) || loading}
                    className={cn(
                      "absolute right-3 bottom-3 rounded-xl p-1.5 transition-all duration-200",
                      loading
                        ? "bg-transparent"
                        : input.trim() || pendingImage
                          ? "bg-primary text-primary-foreground shadow-soft hover:shadow-glow"
                          : "bg-muted text-muted-foreground"
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

              <p className="text-[11px] text-muted-foreground/70 text-center mt-2">
                {loading ? "✨ AI is analyzing..." : "⚠️ DermSight provides general information only — not medical advice."}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
