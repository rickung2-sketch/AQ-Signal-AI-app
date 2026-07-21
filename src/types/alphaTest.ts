export interface AlphaVerificationCheck {
  id: string;
  name: string;
  category: 'engine' | 'data' | 'calculation' | 'latency' | 'rule' | 'guardian' | 'decision' | 'validation' | 'paper';
  status: 'PASSED' | 'WARNING' | 'FAILED';
  details: string;
  timestamp: string;
}

export interface AlphaTestMetrics {
  healthScore: number;
  marketDataQuality: 'EXCELLENT' | 'STABLE' | 'DEGRADED' | 'CRITICAL';
  decisionAccuracyPercent: number;
  validationStatus: 'ACTIVE' | 'WARNING' | 'INACTIVE';
  engineLatencyMs: Record<string, number>;
  averageAnalysisTimeMs: number;
  memoryUsageMb: number;
  networkStatus: 'CONNECTED' | 'DISCONNECTED' | 'SLOW';
  pluginStatus: {
    activeCount: number;
    totalCount: number;
    status: 'OPTIMAL' | 'ISSUES';
  };
}

export interface AlphaReport {
  id: string;
  title: string;
  timestamp: string;
  version: string;
  healthScore: number;
  checks: AlphaVerificationCheck[];
  summary: string;
  warningsCount: number;
  failuresCount: number;
}
