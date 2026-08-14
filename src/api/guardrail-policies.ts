import { httpClient } from "./http";
import type {
  CreateGuardrailPolicyRequest,
  GuardrailPolicy,
  GuardrailPolicyListResponse,
  UpdateGuardrailPolicyRequest,
} from "@/types/guardrail-policy";

export async function listGuardrailPolicies(): Promise<GuardrailPolicyListResponse> {
  const { data } = await httpClient.get<GuardrailPolicyListResponse>(
    "/platform/guardrail-policies",
  );
  return data;
}

export async function getGuardrailPolicy(policyId: string): Promise<GuardrailPolicy> {
  const { data } = await httpClient.get<GuardrailPolicy>(
    `/platform/guardrail-policies/${policyId}`,
  );
  return data;
}

export async function createGuardrailPolicy(
  request: CreateGuardrailPolicyRequest,
): Promise<GuardrailPolicy> {
  const { data } = await httpClient.post<GuardrailPolicy>(
    "/platform/guardrail-policies",
    request,
  );
  return data;
}

export async function updateGuardrailPolicy(
  policyId: string,
  request: UpdateGuardrailPolicyRequest,
): Promise<GuardrailPolicy> {
  const { data } = await httpClient.put<GuardrailPolicy>(
    `/platform/guardrail-policies/${policyId}`,
    request,
  );
  return data;
}

export async function deleteGuardrailPolicy(policyId: string): Promise<void> {
  await httpClient.delete(`/platform/guardrail-policies/${policyId}`);
}
