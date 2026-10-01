import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    __E2E_ENABLE_SW__?: boolean;
  }
}

export const isServiceWorkerAllowed = (
  env?: {
    isNative?: boolean;
    hasSW?: boolean;
    webdriver?: boolean;
    e2eFlag?: boolean;
    search?: string;
  }
): boolean => {
  const isNative = env?.isNative ?? Capacitor.isNativePlatform();
  const hasSW = env?.hasSW ?? (typeof navigator !== 'undefined' && 'serviceWorker' in navigator);
  if (isNative || !hasSW) {
    return false;
  }
  const isWebdriver = env?.webdriver ?? (typeof navigator !== 'undefined' && Boolean(navigator.webdriver));
  if (isWebdriver) {
    const search = env?.search ?? (typeof window !== 'undefined' ? window.location.search : '');
    const hasQueryOverride = new URLSearchParams(search).get('sw') === '1';
    const hasGlobalOverride = env?.e2eFlag ?? (typeof window !== 'undefined' && window.__E2E_ENABLE_SW__ === true);
    return Boolean(hasQueryOverride || hasGlobalOverride);
  }
  return true;
};
