export enum ViolationSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major'
}

export interface RuleViolation {
  rule: string;
  severity: ViolationSeverity;
  explanation: string;
  timestamp: Date;
}
