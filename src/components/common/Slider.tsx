interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  /** Maps the current value to a human-readable description of its effect,
   * e.g. "More precise" ↔ "More creative" — UI Principle #3 (live feedback). */
  describe?: (value: number) => string;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  disabled = false,
  describe,
  formatValue,
}: SliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-navy">{label}</label>
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-navy">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-teal disabled:cursor-not-allowed disabled:opacity-50"
      />
      {describe ? (
        <p className="mt-1 text-xs text-muted-foreground">{describe(value)}</p>
      ) : null}
    </div>
  );
}
