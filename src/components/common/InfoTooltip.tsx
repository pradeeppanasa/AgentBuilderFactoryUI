import { useState } from "react";
import { HelpCircle } from "lucide-react";

// Contextual help (UI Principle #6) — a (?) with one plain-English sentence.
// No external doc links; the explanation lives right here.
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={text}
        className="text-muted-foreground hover:text-teal"
      >
        <HelpCircle size={13} />
      </button>
      {open ? (
        <span className="absolute bottom-full left-1/2 z-10 mb-1.5 w-56 -translate-x-1/2 rounded-md bg-navy px-3 py-2 text-xs leading-snug text-white shadow-lg">
          {text}
        </span>
      ) : null}
    </span>
  );
}
