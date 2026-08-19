import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStepDef {
  id: number;
  label: string;
}

// CLAUDE.md Section 39.3 (2026-08-19, "Confirmed decision") — the formal
// 10-step structure. HITL is its own step (7), not nested under
// Orchestration, since a Standard agent can need human review too.
// Sentence case throughout (design pass, 2026-08-19) — "Creation mode" /
// "Identity & persona", not Title Case, matching the rest of the app's copy.
// eslint-disable-next-line react-refresh/only-export-components -- shared step config, only consumed within this wizard module
export const WIZARD_STEPS: WizardStepDef[] = [
  { id: 1, label: "Creation mode" },
  { id: 2, label: "Identity & persona" },
  { id: 3, label: "Resources" },
  { id: 4, label: "Intelligence" },
  { id: 5, label: "Behaviour" },
  { id: 6, label: "Orchestration" },
  { id: 7, label: "HITL" },
  { id: 8, label: "Review" },
  { id: 9, label: "Test" },
  { id: 10, label: "Publish" },
];

// QA finding U-01 (Wizard Redesign, 2026-08-18 + retest 2026-08-19): the
// original rendering collapsed several steps behind an "Advanced"
// <details> disclosure summary, so the breadcrumb read "1 · 2 · 3 ·
// Advanced · 7 · Advanced · 9" with no numbering for the hidden steps and
// "Advanced" standing in for a step label. Every step now shows only its
// number and real name, sequence 1-10, no gaps, no "Advanced" text anywhere.
//
// Design pass (2026-08-19): the previous 20px circles + 14px labels read as
// cramped and hard to scan at a glance. Bumped to 32px circles, 15px
// labels, a filled highlight on the active row instead of a thin left
// border, a checkmark for completed steps, and a connector line between
// steps so the sequence reads as one continuous path rather than a plain
// list.
export function WizardNav({
  activeStep,
  onSelect,
  completedSteps,
}: {
  activeStep: number;
  onSelect: (step: number) => void;
  completedSteps: Set<number>;
}) {
  return (
    <nav className="w-[240px] shrink-0">
      {WIZARD_STEPS.map((step, index) => {
        const active = activeStep === step.id;
        const done = completedSteps.has(step.id);
        const isLast = index === WIZARD_STEPS.length - 1;

        return (
          <div key={step.id}>
            <button
              type="button"
              onClick={() => onSelect(step.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                active
                  ? "bg-teal/10"
                  : "hover:bg-muted/60",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors",
                  active
                    ? "border-transparent bg-teal text-white shadow-sm"
                    : done
                      ? "border-transparent bg-emerald-500 text-white"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {done && !active ? <Check size={15} strokeWidth={2.5} /> : step.id}
              </span>
              <span
                className={cn(
                  "flex-1 text-[15px] leading-snug",
                  active
                    ? "font-semibold text-teal"
                    : done
                      ? "font-medium text-navy/80"
                      : "font-normal text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </button>
            {!isLast ? (
              <div
                className={cn(
                  "ml-[27px] h-3 w-[1.5px]",
                  done ? "bg-emerald-400" : "bg-border",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
