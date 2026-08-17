import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStepDef {
  id: number;
  label: string;
  advanced?: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components -- shared step config, only consumed within this wizard module
export const WIZARD_STEPS: WizardStepDef[] = [
  { id: 1, label: "Purpose" },
  { id: 2, label: "Identity & Persona" },
  { id: 3, label: "Resources" },
  { id: 4, label: "Intelligence", advanced: true },
  { id: 5, label: "Behaviour", advanced: true },
  { id: 6, label: "Orchestration", advanced: true },
  { id: 7, label: "Review" },
  { id: 8, label: "Test", advanced: true },
  { id: 9, label: "Publish" },
];

export function WizardNav({
  activeStep,
  onSelect,
  completedSteps,
}: {
  activeStep: number;
  onSelect: (step: number) => void;
  completedSteps: Set<number>;
}) {
  const primary = WIZARD_STEPS.filter((s) => !s.advanced);
  const advanced = WIZARD_STEPS.filter((s) => s.advanced);

  function StepButton({ step }: { step: WizardStepDef }) {
    const active = activeStep === step.id;
    const done = completedSteps.has(step.id);
    return (
      <button
        type="button"
        onClick={() => onSelect(step.id)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md border-l-2 px-2.5 py-2 text-left text-sm transition-colors",
          active
            ? "border-teal bg-teal/5 font-medium text-teal"
            : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-navy",
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
            active
              ? "bg-teal text-white"
              : done
                ? "bg-emerald-100 text-emerald-700"
                : "bg-muted text-muted-foreground",
          )}
        >
          {step.id}
        </span>
        {step.label}
      </button>
    );
  }

  return (
    <nav className="w-[220px] shrink-0 space-y-3">
      {primary
        .filter((s) => s.id <= 3)
        .map((step) => (
          <StepButton key={step.id} step={step} />
        ))}

      <details open={advanced.some((s) => s.id === activeStep)} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <ChevronRight size={12} className="group-open:hidden" />
          <ChevronDown size={12} className="hidden group-open:block" />
          Advanced
        </summary>
        <div className="mt-1 space-y-0.5">
          {advanced
            .filter((s) => s.id <= 6)
            .map((step) => (
              <StepButton key={step.id} step={step} />
            ))}
        </div>
      </details>

      <StepButton step={primary.find((s) => s.id === 7)!} />

      <details open={activeStep === 8} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <ChevronRight size={12} className="group-open:hidden" />
          <ChevronDown size={12} className="hidden group-open:block" />
          Advanced
        </summary>
        <div className="mt-1">
          <StepButton step={advanced.find((s) => s.id === 8)!} />
        </div>
      </details>

      <StepButton step={primary.find((s) => s.id === 9)!} />
    </nav>
  );
}
