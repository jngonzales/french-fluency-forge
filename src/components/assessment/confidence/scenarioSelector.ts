/**
 * Scenario Selector
 * 
 * Logic to select appropriate confidence scenario based on user history or preferences.
 */

import scenariosData from './scenarios.json';
import type { ConfidenceScenario } from './types';

export const scenarios = scenariosData.scenarios as ConfidenceScenario[];

/**
 * Get all scenarios for a specific tier
 */
export function getScenariosByTier(tier: 1 | 2 | 3): ConfidenceScenario[] {
  return scenarios.filter(s => s.tier === tier);
}

/**
 * Get a scenario by ID
 */
export function getScenarioById(id: string): ConfidenceScenario | undefined {
  return scenarios.find(s => s.id === id);
}

/**
 * Select a scenario based on user's assessment history
 * 
 * @param userHistory Optional user performance data
 * @returns Selected scenario
 */
export function selectScenario(userHistory?: {
  previousConfidenceScore?: number;
  previousAttempts?: number;
}): ConfidenceScenario {
  // If no history, start with Tier 1
  if (!userHistory || !userHistory.previousConfidenceScore) {
    const tier1Scenarios = getScenariosByTier(1);
    return tier1Scenarios[Math.floor(Math.random() * tier1Scenarios.length)];
  }
  
  // Determine tier based on previous score
  let tier: 1 | 2 | 3;
  const score = userHistory.previousConfidenceScore;
  
  if (score < 50) {
    tier = 1; // Low confidence -> Tier 1 (easier)
  } else if (score < 75) {
    tier = 2; // Medium confidence -> Tier 2
  } else {
    tier = 3; // High confidence -> Tier 3 (harder)
  }
  
  // Get scenarios for the tier
  const tierScenarios = getScenariosByTier(tier);
  
  // Random selection within tier
  return tierScenarios[Math.floor(Math.random() * tierScenarios.length)];
}

/**
 * Select a specific tier (for testing or explicit choice)
 */
export function selectScenarioByTier(tier: 1 | 2 | 3): ConfidenceScenario {
  const tierScenarios = getScenariosByTier(tier);
  if (tierScenarios.length === 0) {
    throw new Error(`No scenarios found for tier ${tier}`);
  }
  return tierScenarios[Math.floor(Math.random() * tierScenarios.length)];
}

/**
 * Get scenario metadata for display
 */
export function getScenarioMetadata(scenario: ConfidenceScenario) {
  return {
    id: scenario.id,
    title: scenario.title,
    tier: scenario.tier,
    turnCount: scenario.turns.length,
    estimatedDuration: Math.round(
      scenario.turns.reduce((sum, turn) => sum + turn.expectedDuration, 0) / 60
    ), // In minutes
    difficulty: scenario.tier === 1 ? 'Easy' : scenario.tier === 2 ? 'Medium' : 'Hard'
  };
}

/**
 * Get all available scenarios (for dev mode selector)
 */
export function getAllScenarios(): ConfidenceScenario[] {
  return scenarios;
}

