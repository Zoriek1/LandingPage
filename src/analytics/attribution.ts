import { safeDimension, type Attribution } from '../../shared/analytics-contract.ts';

export function extractSanitizedReferrerHost(referrer?: string): string | undefined {
  const ref = referrer ?? (typeof document !== 'undefined' ? document.referrer : '');
  if (!ref) return undefined;
  try {
    const url = new URL(ref);
    if (typeof window !== 'undefined' && url.hostname === window.location.hostname) {
      return undefined;
    }
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (
      host.length <= 253 &&
      /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) &&
      !/\d{7,}/.test(host)
    ) {
      return host;
    }
  } catch {
    // Malformed referrer URL
  }
  return undefined;
}

export function extractCurrentUtms(search?: string): NonNullable<Attribution['current']> | undefined {
  const searchStr = search ?? (typeof window !== 'undefined' ? window.location.search : '');
  if (!searchStr) return undefined;

  try {
    const params = new URLSearchParams(searchStr);
    const rawSource = params.get('utm_source');
    const rawMedium = params.get('utm_medium');
    const rawCampaign = params.get('utm_campaign');

    const source = safeDimension(rawSource) ? rawSource : undefined;
    const medium = safeDimension(rawMedium) ? rawMedium : undefined;
    const campaign = safeDimension(rawCampaign) ? rawCampaign : undefined;

    if (!source && !medium && !campaign) {
      return undefined;
    }

    const res: NonNullable<Attribution['current']> = {};
    if (source) res.utm_source = source;
    if (medium) res.utm_medium = medium;
    if (campaign) res.utm_campaign = campaign;
    return res;
  } catch {
    return undefined;
  }
}

export function buildEventAttribution(
  sessionEntry?: Attribution['session_entry'],
  referrerHost?: string,
): Attribution | undefined {
  const current = extractCurrentUtms();
  const host = referrerHost ?? extractSanitizedReferrerHost();

  const result: Attribution = {};
  let hasAny = false;

  if (sessionEntry && Object.keys(sessionEntry).length > 0) {
    result.session_entry = sessionEntry;
    hasAny = true;
  }
  if (current && Object.keys(current).length > 0) {
    result.current = current;
    hasAny = true;
  }
  if (host) {
    result.referrer_host = host;
    hasAny = true;
  }

  return hasAny ? result : undefined;
}
