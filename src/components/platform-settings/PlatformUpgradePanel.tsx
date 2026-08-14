import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpCircle } from "lucide-react";
import {
  getPlatformUpgrade,
  getPlatformVersion,
  triggerPlatformUpgrade,
} from "@/api/platform";
import { Badge, Button, LoadingSpinner } from "@/components/common";
import { useAuthStore } from "@/store/useAuthStore";
import {
  UPGRADE_STAGE_LABELS,
  isTerminalUpgradeStatus,
} from "@/types/platform";
import type { UpgradeStatus } from "@/types/platform";
import { UpgradeStageTracker } from "./UpgradeStageTracker";

const UPGRADE_STATUS_VARIANT: Record<
  UpgradeStatus,
  "success" | "warning" | "destructive" | "secondary" | "accent"
> = {
  PENDING: "secondary",
  PULLING_IMAGE: "accent",
  REGISTERING_TASK_DEFINITION: "accent",
  UPDATING_SERVICE: "accent",
  HEALTH_CHECK: "accent",
  ACTIVE: "success",
  FAILED: "destructive",
  ROLLED_BACK: "warning",
};

export function PlatformUpgradePanel() {
  const role = useAuthStore((state) => state.currentUser?.role);
  const isAdmin = role === "admin";

  const [targetVersion, setTargetVersion] = useState("");
  const [upgradeId, setUpgradeId] = useState<string | null>(null);

  const {
    data: versionInfo,
    isLoading: versionLoading,
    isError: versionError,
  } = useQuery({
    queryKey: ["platform", "version"],
    queryFn: getPlatformVersion,
  });

  const upgradeMutation = useMutation({
    mutationFn: () =>
      triggerPlatformUpgrade(
        targetVersion.trim() ? { target_version: targetVersion.trim() } : {},
      ),
    onSuccess: (result) => {
      setUpgradeId(result.upgrade_id);
      setTargetVersion("");
    },
  });

  const { data: upgrade } = useQuery({
    queryKey: ["platform", "upgrades", upgradeId],
    queryFn: () => getPlatformUpgrade(upgradeId as string),
    enabled: Boolean(upgradeId),
    refetchInterval: (query) =>
      query.state.data && isTerminalUpgradeStatus(query.state.data.status)
        ? false
        : 10000,
  });

  const upgradeInFlight = Boolean(upgrade && !isTerminalUpgradeStatus(upgrade.status));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy">Platform Version</h2>

        {versionLoading ? (
          <div className="mt-3">
            <LoadingSpinner size={20} />
          </div>
        ) : versionError || !versionInfo ? (
          <p className="mt-3 text-sm text-destructive">
            Could not load platform version.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Running{" "}
              <span className="font-mono text-navy">
                v{versionInfo.platform_version}
              </span>
            </p>

            {versionInfo.update_available ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-teal/30 bg-teal/5 px-4 py-3">
                <ArrowUpCircle size={18} className="shrink-0 text-teal" />
                <p className="text-sm text-navy">
                  Update available:{" "}
                  <span className="font-mono font-medium">
                    v{versionInfo.available_update}
                  </span>
                </p>

                {isAdmin ? (
                  <div className="ml-auto flex items-center gap-2">
                    <input
                      type="text"
                      value={targetVersion}
                      onChange={(event) => setTargetVersion(event.target.value)}
                      placeholder={`Default: v${versionInfo.available_update}`}
                      disabled={upgradeMutation.isPending || upgradeInFlight}
                      className="w-48 rounded-md border border-input bg-background px-2 py-1.5 text-xs disabled:opacity-50"
                    />
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => upgradeMutation.mutate()}
                      disabled={upgradeMutation.isPending || upgradeInFlight}
                    >
                      {upgradeMutation.isPending
                        ? "Starting…"
                        : upgradeInFlight
                          ? "Upgrade in progress…"
                          : "Upgrade Now"}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Platform is up to date.
              </p>
            )}

            {upgradeMutation.isError ? (
              <p className="mt-2 text-xs text-destructive">
                Failed to trigger upgrade. Please try again.
              </p>
            ) : null}
          </>
        )}
      </div>

      {upgrade ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-navy">
              Upgrade {upgrade.upgrade_id}
            </h2>
            <Badge variant={UPGRADE_STATUS_VARIANT[upgrade.status]}>
              {UPGRADE_STAGE_LABELS[upgrade.status] ?? upgrade.status}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            v{upgrade.from_version} → v{upgrade.target_version} · triggered by{" "}
            {upgrade.triggered_by}
          </p>

          {upgrade.failure_reason ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <span className="font-medium">
                {upgrade.failed_stage
                  ? `${UPGRADE_STAGE_LABELS[upgrade.failed_stage] ?? upgrade.failed_stage}: `
                  : ""}
              </span>
              {upgrade.failure_reason}
            </div>
          ) : null}

          <div className="mt-3">
            <UpgradeStageTracker upgrade={upgrade} />
          </div>

          {upgradeInFlight ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Refreshing every 10 seconds while the upgrade runs…
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
