import { describe, expect, it } from 'vitest';
import { periodRange } from './time';

describe('periodRange', () => {
  it('usa o começo do dia de São Paulo em UTC para Hoje', () => {
    const range = periodRange('today', new Date('2026-10-13T15:00:00.000Z'));
    expect(range.from).toBe('2026-10-13T03:00:00.000Z');
    expect(range.to).toBe('2026-10-13T15:00:00.000Z');
  });
  it('inclui hoje na janela de sete dias do calendário local', () => {
    const range = periodRange('7d', new Date('2026-10-13T15:00:00.000Z'));
    expect(range.from).toBe('2026-10-07T03:00:00.000Z');
  });
  it('rejeita faixa invertida ou acima de 31 dias', () => {
    expect(() => periodRange('custom', new Date(), { from: '2026-10-13', to: '2026-10-12' })).toThrow();
    expect(() => periodRange('custom', new Date(), { from: '2026-09-01', to: '2026-10-13' })).toThrow();
  });
});
