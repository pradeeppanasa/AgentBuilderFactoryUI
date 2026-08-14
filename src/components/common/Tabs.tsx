import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
}

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            value === tab.value
              ? "border-teal text-navy"
              : "border-transparent text-muted-foreground hover:text-navy",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
