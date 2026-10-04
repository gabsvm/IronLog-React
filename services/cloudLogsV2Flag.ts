// Q21: the V2 build flag lives in its own tiny module so callers on the
// startup path (syncService, accountDeletion) can check it without pulling
// the V2 implementation into the entry chunk; V2 itself is imported lazily.

/**
 * Build flag (OFF unless exactly '1'). The env map is a parameter — same
 * pattern as shouldUseFirebaseEmulator — because vi.stubEnv does not reach
 * import.meta.env in this repo's vitest setup (verified Q21); production
 * callers use the default (live import.meta.env, read on every call).
 */
export const isCloudLogsV2Enabled = (
    envMap: Record<string, string | undefined> = (import.meta as { env?: Record<string, string | undefined> }).env ?? {},
): boolean => envMap.VITE_CLOUD_LOGS_V2 === '1';
