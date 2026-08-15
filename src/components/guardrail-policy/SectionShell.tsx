import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface NavGroup {
  title: string;
  items: { id: string; label: string }[];
}

// Left sidebar nav (fixed 200px) + right scrollable form (max 680px) — 37.14's
// two-column layout. Active section is whichever the user last clicked; we
// don't scroll-spy against page position to keep this simple and predictable.
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
    <nav className="w-[200px] shrink-0 space-y-4">
      {groups.map((group) => (
        <div key={group.title}>
          {group.title ? (
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {group.title}
            </p>
          ) : null}
          <div className="mt-1 space-y-0.5">
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "block w-full rounded-md border-l-2 px-2.5 py-1.5 text-left text-sm transition-colors",
                  activeId === item.id
                    ? "border-teal bg-teal/5 font-medium text-teal"
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-navy",
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
    <section id={id} className="scroll-mt-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
        {badge}
      </div>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
