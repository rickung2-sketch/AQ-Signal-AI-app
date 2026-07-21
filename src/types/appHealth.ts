export type ComponentHealthStatus = 'Healthy' | 'Warning' | 'Offline' | 'Error';

export interface ComponentHealth {
  id: string;
  name: string;
  status: ComponentHealthStatus;
  details: string;
}

export interface MetricHealth {
  id: string;
  name: string;
  value: string | number;
  status: ComponentHealthStatus;
  unit?: string;
  details: string;
}

export interface BackgroundTask {
  id: string;
  name: string;
  status: 'Running' | 'Idle' | 'Failed';
  lastRun: string;
}

export interface AppHealthState {
  components: ComponentHealth[];
  metrics: MetricHealth[];
  lastSyncTime: string;
  dbConnection: {
    status: ComponentHealthStatus;
    latencyMs: number;
    host: string;
  };
  backgroundTasks: BackgroundTask[];
}

export interface FeatureFlags {
  enableDiagnostics: boolean;
  simulationAcceleration: boolean;
  highPrecisionMetrics: boolean;
}
