import { AIModelProvider } from '../providers/AIModelProvider';
import { Position } from '../models/Position';

export interface ModelAssignment {
  affirmativeModel: AIModelProvider;
  negativeModel: AIModelProvider;
}

/**
 * Selects two distinct models from the available providers.
 * @param availableModels - Array of available AI model providers
 * @returns Two distinct models, or throws an error if insufficient models
 * @throws Error if fewer than 2 models are available
 */
export function selectModels(availableModels: AIModelProvider[]): [AIModelProvider, AIModelProvider] {
  if (availableModels.length < 2) {
    throw new Error(`Insufficient models available. Need at least 2 models, but only ${availableModels.length} available.`);
  }

  // Select two distinct models
  const firstModel = availableModels[0];
  const secondModel = availableModels[1];

  return [firstModel, secondModel];
}

/**
 * Randomly assigns positions (affirmative/negative) to two models.
 * @param model1 - First AI model provider
 * @param model2 - Second AI model provider
 * @returns Object with affirmativeModel and negativeModel assignments
 */
export function assignPositions(model1: AIModelProvider, model2: AIModelProvider): ModelAssignment {
  // Randomly decide which model gets affirmative position
  const model1IsAffirmative = Math.random() < 0.5;

  if (model1IsAffirmative) {
    return {
      affirmativeModel: model1,
      negativeModel: model2
    };
  } else {
    return {
      affirmativeModel: model2,
      negativeModel: model1
    };
  }
}

/**
 * Selects two distinct models and assigns them to positions.
 * @param availableModels - Array of available AI model providers
 * @returns Object with affirmativeModel and negativeModel assignments
 * @throws Error if fewer than 2 models are available
 */
export function selectAndAssignModels(availableModels: AIModelProvider[]): ModelAssignment {
  const [model1, model2] = selectModels(availableModels);
  return assignPositions(model1, model2);
}
