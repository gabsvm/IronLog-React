export type PerformanceRecoveryMode = 'green' | 'yellow';

let pendingMode: PerformanceRecoveryMode | null = null;

export function setPendingPerformanceRecoveryMode(mode: PerformanceRecoveryMode) {
  pendingMode = mode;
}

export function consumePendingPerformanceRecoveryMode(): PerformanceRecoveryMode {
  const mode = pendingMode || 'green';
  pendingMode = null;
  return mode;
}

export function clearPendingPerformanceRecoveryMode() {
  pendingMode = null;
}
