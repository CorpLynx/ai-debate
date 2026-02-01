import { ViolationSeverity } from './RuleViolation';

export interface FallacyDetection {
  fallacyType: string;
  explanation: string;
  severity: ViolationSeverity;
}
