export type EngineId =
  | 'market-data'
  | 'rule-engine'
  | 'decision-engine'
  | 'guardian-engine'
  | 'strategy-engine'
  | 'scanner'
  | 'validation-mode'
  | 'plugin-manager'
  | 'broker-manager'
  | 'mission-control';

export type EngineStatus = 'ONLINE' | 'OFFLINE' | 'RESTARTING' | 'DEGRADED';

export interface EngineInfo {
  id: EngineId;
  name: string;
  status: EngineStatus;
  uptimeSeconds: number;
  lastActiveTime: string;
  processedCount: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  threads: number;
}

export type TaskPriority = 'IMMEDIATE' | 'CRITICAL' | 'NORMAL' | 'BACKGROUND';

export interface OSTask {
  id: string;
  name: string;
  targetEngine: EngineId;
  priority: TaskPriority;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  payloadSizeKb: number;
  queuedTime: string;
  executionTimeMs?: number;
}

export interface OSBackgroundJob {
  id: string;
  name: string;
  intervalMs: number;
  lastRunTime: string;
  nextRunTime: string;
  status: 'IDLE' | 'RUNNING' | 'PAUSED';
  executionCount: number;
}

export interface OSTimelineEvent {
  id: string;
  timestamp: string;
  category: 'SYSTEM' | 'ENGINE' | 'SECURITY' | 'COMMUNICATION' | 'QUEUE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  message: string;
  source: string;
}

export interface OSMetrics {
  cpuLoadPercent: number;
  memoryUsedMb: number;
  memoryMaxMb: number;
  pluginCount: number;
  activeTasksCount: number;
  lastDecisionTime: string;
  decisionRatePerMin: number;
  uptimeSeconds: number;
}
