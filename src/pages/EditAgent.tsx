import { useParams } from "react-router-dom";

export default function EditAgent() {
  const { agentId } = useParams<{ agentId: string }>();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Edit Agent</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Editing {agentId} — wizard arrives in a later phase.
      </p>
    </div>
  );
}
