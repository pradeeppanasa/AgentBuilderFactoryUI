import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface NavGroup {
  title: string;
  items: { id: string; label: string }[];
}

// Left sidebar nav (fixed 224px) + right scrollable form (max 680px) — 37.14's
// two-column layout. Active section is whichever the user last clicked; we
// don't scroll-spy against page position to keep this simple and predictable.
//
// Design pass (2026-08-19): the original 11px uppercase group labels and 14px
// items with a thin left border read as cramped for a form this long and
// dense. Bumped group labels and item text up a size, switched the active
// state to a filled pill (easier to spot at a glance while scrolling a long
// form) and gave items more vertical breathing room.
export function SectionNav({
  groups,
  activeId,
  onSelect,
}: {
  groups: NavGroup[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="w-[224px] shrink-0 space-y-5">
      {groups.map((group) => (
        <div key={group.title}>
          {group.title ? (
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
              {group.title}
            </p>
          ) : null}
          <div className={cn("space-y-0.5", group.title ? "mt-1.5" : undefined)}>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left text-[15px] transition-colors",
                  activeId === item.id
                    ? "bg-teal/10 font-semibold text-teal"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-navy",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Section({
  id,
  title,
  badge,
  description,
  children,
}: {
  id: string;
  title: string;
  badge?: ReactNode;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-4 rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-navy">{title}</h2>
        {badge}
      </div>
      {description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
