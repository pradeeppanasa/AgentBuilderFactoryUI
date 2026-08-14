import { httpClient } from "./http";
import type { DeploymentRecord } from "@/types/deployment";

export async function getDeployment(
  deploymentId: string,
): Promise<DeploymentRecord> {
  const { data } = await httpClient.get<DeploymentRecord>(
    `/deployments/${deploymentId}`,
  );
  return data;
}
