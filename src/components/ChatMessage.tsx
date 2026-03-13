import ReactMarkdown from "react-markdown";
import { User, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/chat";

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const textContent = typeof message.content === "string"
    ? message.content
    : message.content.filter((c) => c.type === "text").map((c) => (c as { type: "text"; text: string }).text).join("\n");

  return (
    <div className={cn(
      "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser && "flex-row-reverse"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-soft",
        isUser ? "bg-primary" : "bg-secondary"
      )}>
        {isUser
          ? <User className="w-4 h-4 text-primary-foreground" />
          : <Stethoscope className="w-4 h-4 text-secondary-foreground" />
        }
      </div>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-3 shadow-soft",
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-md"
          : "bg-card border border-border rounded-tl-md"
      )}>
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Uploaded skin image"
            className="rounded-xl mb-2 max-w-[280px] max-h-[200px] object-cover border border-border/50"
          />
        )}
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{textContent}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-semibold [&_strong]:text-primary [&_li]:marker:text-primary">
            <ReactMarkdown>{textContent}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
