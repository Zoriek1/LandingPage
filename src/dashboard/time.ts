export type Period = 'today' | '60m' | '7d' | 'custom';
const SP = 'America/Sao_Paulo';

export function periodRange(period: Period, now = new Date(), custom?: { from: string; to: string }) {
  if (period === 'custom' && custom) {
    const from = new Date(`${custom.from}T00:00:00-03:00`);
    const to = new Date(`${custom.to}T00:00:00-03:00`);
    to.setDate(to.getDate() + 1);
    if (to <= from || to.getTime() - from.getTime() > 31 * 86400000) throw new Error('Escolha até 31 dias.');
    return { from: from.toISOString(), to: to.toISOString() };
  }
  if (period === '60m') return { from: new Date(now.getTime() - 3600000).toISOString(), to: now.toISOString() };
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: SP, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const day = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const today = `${day.year}-${day.month}-${day.day}`;
  const from = new Date(`${today}T00:00:00-03:00`);
  if (period === '7d') from.setDate(from.getDate() - 6);
  return { from: from.toISOString(), to: now.toISOString() };
}
export function displayTime(value: string) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: SP }).format(new Date(value)); }
