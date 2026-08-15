import { Section } from "./SectionShell";
import { inputClass } from "./formClasses";

interface BasicInfoSectionProps {
  name: string;
  description: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  readOnly: boolean;
  isNew: boolean;
}

// 37.14: "Read-only after save: Applied to N agents badge + agent names" is
// intentionally NOT rendered here — no GET endpoint on this policy or the
// agent registry currently returns which agents reference a policy. The only
// real signal of usage this backend exposes is the 409 conflict (with agent
// ids in its `detail`) returned by DELETE when a referenced policy is
// removed, which the list page already surfaces reactively.
export function BasicInfoSection({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  readOnly,
  isNew,
}: BasicInfoSectionProps) {
  return (
    <Section id="basic-info" title="Basic info">
      <div>
        <label className="text-sm font-medium text-navy">Name</label>
        <input
          className={`${inputClass} mt-1`}
          value={name}
          disabled={readOnly}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-navy">Description</label>
        <input
          className={`${inputClass} mt-1`}
          value={description}
          disabled={readOnly}
          onChange={(e) => onDescriptionChange(e.target.value)}
          required
        />
      </div>
      {!isNew ? (
        <p className="text-xs text-muted-foreground">
          Usage isn't reported live by this policy — deleting a policy still in use will list
          which agents reference it.
        </p>
      ) : null}
    </Section>
  );
}
