import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/common";

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-24 text-center">
      <ShieldAlert size={32} className="text-muted-foreground" />
      <h1 className="text-lg font-semibold text-navy">403 — Not authorized</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page is admin-only. Contact your platform admin if you believe you should have
        access.
      </p>
      <Link to="/">
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
