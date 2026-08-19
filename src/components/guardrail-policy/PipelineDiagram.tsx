import type { LucideIcon } from "lucide-react";
import { ArrowRight, HelpCircle, ShieldCheck, ShieldHalf, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayerCardProps {
  icon: LucideIcon;
  iconWrapClass: string;
  borderClass: string;
  bgClass: string;
  titleClass: string;
  title: string;
  subtitle: string;
  subtitleClass: string;
}

function LayerCard({
  icon: Icon,
  iconWrapClass,
  borderClass,
  bgClass,
  titleClass,
  title,
  subtitle,
  subtitleClass,
}: LayerCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-[168px] flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-3.5 text-center shadow-sm",
        borderClass,
        bgClass,
      )}
    >
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", iconWrapClass)}>
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <div>
        <p className={cn("text-sm font-semibold", titleClass)}>{title}</p>
        <p className={cn("mt-0.5 text-xs leading-snug", subtitleClass)}>{subtitle}</p>
      </div>
    </div>
  );
}

// Pinned, non-interactive 3-layer flow diagram (37.14) — shown at the top of
// the policy editor above every section. Purely informational.
//
// Design pass (2026-08-19): the original was a row of tiny, same-weight text
// boxes that read as a plain list rather than a pipeline. Gave each stage an
// icon and its own accent color, sized the cards up, and let the row wrap on
// narrower screens instead of forcing a horizontal scrollbar.
export function PipelineDiagram() {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-b from-muted/30 to-transparent p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
        How a message is screened
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <LayerCard
          icon={ShieldHalf}
          iconWrapClass="bg-purple-100 text-purple-700"
          borderClass="border-purple-200"
          bgClass="bg-purple-50/70"
          titleClass="text-purple-800"
          title="Layer 1 · BERT"
          subtitle="local, ~50ms, inside VPC"
          subtitleClass="text-purple-700/80"
        />
        <ArrowRight size={18} className="hidden shrink-0 text-muted-foreground/60 sm:block" />
        <LayerCard
          icon={HelpCircle}
          iconWrapClass="bg-muted text-muted-foreground"
          borderClass="border-border"
          bgClass="bg-background"
          titleClass="text-navy"
          title="Unsure?"
          subtitle="escalate 0.40–0.85"
          subtitleClass="text-muted-foreground"
        />
        <ArrowRight size={18} className="hidden shrink-0 text-muted-foreground/60 sm:block" />
        <LayerCard
          icon={ShieldCheck}
          iconWrapClass="bg-blue-100 text-blue-700"
          borderClass="border-blue-200"
          bgClass="bg-blue-50/70"
          titleClass="text-blue-800"
          title="Layer 2 · Bedrock"
          subtitle="content filters"
          subtitleClass="text-blue-700/80"
        />
        <ArrowRight size={18} className="hidden shrink-0 text-muted-foreground/60 sm:block" />
        <LayerCard
          icon={Sparkles}
          iconWrapClass="bg-emerald-100 text-emerald-700"
          borderClass="border-emerald-200"
          bgClass="bg-emerald-50/70"
          titleClass="text-emerald-800"
          title="Layer 3 · LLM"
          subtitle="output → Layer 2 only"
          subtitleClass="text-emerald-700/80"
        />
      </div>
    </div>
  );
}
