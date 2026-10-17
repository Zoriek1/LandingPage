export {
  initAnalytics,
  navigateAnalytics,
  recordAnalytics,
  onAnalyticsPageView,
  registerAnalyticsConsentAdapter,
  resetCollectorForTesting,
} from './collector.ts';

export type {
  AnalyticsConsentAdapter,
  ConsentState,
} from './types.ts';
