export type JobState = 'espera' | 'lavando' | 'listo' | 'entregado';
export type Job = { id: string; plate: string; service: string; amount: number; state: JobState; payment_method: 'efectivo' | 'transferencia' | null; created_at: string };
export const states: JobState[] = ['espera', 'lavando', 'listo', 'entregado'];
export const labels = { espera: 'En espera', lavando: 'Lavando', listo: 'Listos', entregado: 'Entregados' };
export function validJob(data: any) { return typeof data?.plate === 'string' && /^[A-Z0-9 -]{3,15}$/.test(data.plate) && typeof data?.service === 'string' && data.service.trim().length >= 2 && data.service.length <= 80 && Number.isSafeInteger(data?.amount) && data.amount > 0 && data.amount <= 100000000; }
export function canAdvance(from: JobState, to: JobState) { return states.indexOf(to) === states.indexOf(from) + 1 && states.includes(to); }
