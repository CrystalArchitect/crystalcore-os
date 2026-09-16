/**
 * Pre-flight cost estimate stub.
 * Refuses only when Crystal has configured ceilings and estimate would breach them.
 * Never invents margin percentages or list prices.
 */

export interface CostEstimateInput {
  providerCostEstimate: number | null;
  remainingProviderCeiling: number | null;
  marginFloorConfigured: boolean;
}

export interface CostEstimateResult {
  proceed: boolean;
  reason?: string;
}

export function preflightCostEstimate(
  input: CostEstimateInput,
): CostEstimateResult {
  if (
    input.providerCostEstimate !== null &&
    input.remainingProviderCeiling !== null &&
    input.providerCostEstimate > input.remainingProviderCeiling
  ) {
    return {
      proceed: false,
      reason: 'would_breach_provider_spend_ceiling',
    };
  }
  return { proceed: true };
}
