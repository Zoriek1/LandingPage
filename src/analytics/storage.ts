const memoryStorage = new Map<string, string>();

let isSessionStorageAvailable: boolean | null = null;

function checkSessionStorage(): boolean {
  if (isSessionStorageAvailable !== null) return isSessionStorageAvailable;
  if (typeof window === 'undefined') {
    isSessionStorageAvailable = false;
    return false;
  }
  try {
    const testKey = '__puf_storage_test__';
    window.sessionStorage.setItem(testKey, '1');
    window.sessionStorage.removeItem(testKey);
    isSessionStorageAvailable = true;
  } catch {
    isSessionStorageAvailable = false;
  }
  return isSessionStorageAvailable;
}

export function getStorageMode(): 'session' | 'memory' {
  return checkSessionStorage() ? 'session' : 'memory';
}

export function readStorage(key: string, consentGranted: boolean): string | null {
  if (!consentGranted) return null;
  if (checkSessionStorage()) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  }
  return memoryStorage.get(key) ?? null;
}

export function writeStorage(key: string, value: string, consentGranted: boolean): void {
  if (!consentGranted) return;
  if (checkSessionStorage()) {
    try {
      window.sessionStorage.setItem(key, value);
      return;
    } catch {
      // Quota or security error, fallback to memory
    }
  }
  memoryStorage.set(key, value);
}

export function removeStorage(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  memoryStorage.delete(key);
}

export function clearAnalyticsStorage(): void {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem('_puf_analytics_v1_session');
      window.sessionStorage.removeItem('_puf_analytics_v1_queue');
      window.sessionStorage.removeItem('_puf_analytics_v1_consent');
    } catch {
      // ignore
    }
  }
  memoryStorage.delete('_puf_analytics_v1_session');
  memoryStorage.delete('_puf_analytics_v1_queue');
  memoryStorage.delete('_puf_analytics_v1_consent');
}

export function resetStorageModeForTesting(): void {
  isSessionStorageAvailable = null;
  memoryStorage.clear();
}
