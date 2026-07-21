export interface TestCaseResult {
  id: string;
  name: string;
  engine: 'Rule Engine' | 'Decision Engine' | 'Guardian' | 'Strategy Engine' | 'Indicator Engine' | 'Market Structure Engine' | 'Paper Trading' | 'Validation Mode';
  description: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  message?: string;
  details?: string;
}

export interface RegressionTestRun {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNINGS' | 'FAILURE';
  executionTimeMs: number;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  results: TestCaseResult[];
  warnings: string[];
  isAutoRun: boolean;
}

export interface RegressionSettings {
  autoRunEnabled: boolean;
  autoRunIntervalSeconds: number; // e.g. 30 seconds
  stopOnFirstFailure: boolean;
}
