import { PlatformUpgradePanel } from "@/components/platform-settings/PlatformUpgradePanel";
import { TelemetryConfigPanel } from "@/components/platform-settings/TelemetryConfigPanel";

export default function PlatformSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Platform Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform version, upgrade status, and telemetry configuration.
        </p>
      </div>

      <PlatformUpgradePanel />
      <TelemetryConfigPanel />
    </div>
  );
}
