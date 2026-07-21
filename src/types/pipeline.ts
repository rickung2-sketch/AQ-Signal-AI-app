export type StageId =
  | 'market-data'
  | 'indicator-engine'
  | 'market-structure'
  | 'market-intelligence'
  | 'strategy-engine'
  | 'rule-engine'
  | 'guardian'
  | 'ai-debate'
  | 'second-opinion'
  | 'decision-engine'
  | 'validation'
  | 'decision-ledger';

export type StageStatus = 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'FAILED' | 'SKIPPED';

export interface PipelineStage {
  id: StageId;
  name: string;
  status: StageStatus;
  executionTimeMs: number;
  confidencePercent: number;
  resultSummary: string;
  inspectDetails: {
    title: string;
    description: string;
    technicalOutput: string;
    metrics: { label: string; value: string | number }[];
  };
}

export interface PipelineExecution {
  id: string;
  timestamp: string;
  asset: string;
  direction: 'LONG' | 'SHORT' | 'HOLD';
  overallConfidencePercent: number;
  stages: PipelineStage[];
  status: 'SUCCESS' | 'BLOCKED' | 'PROCESSING' | 'ERROR';
}
