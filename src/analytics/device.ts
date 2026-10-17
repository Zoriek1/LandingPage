import type { DeviceClass, EntryType } from '../../shared/analytics-contract.ts';

export function detectDeviceClass(): DeviceClass {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPad|Tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'mobile';
  }
  if (window.innerWidth && window.innerWidth < 768) return 'mobile';
  if (window.innerWidth && window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

export function resolveEntryInfo(canonPath: string): { entry_type: EntryType; lp_slug?: string } {
  if (canonPath === '/') {
    return { entry_type: 'main' };
  }
  if (canonPath === '/loja-fisica/') {
    return { entry_type: 'physical_store' };
  }
  const slug = canonPath.replace(/^\//, '').replace(/\/$/, '');
  return { entry_type: 'ad_lp', lp_slug: slug };
}
