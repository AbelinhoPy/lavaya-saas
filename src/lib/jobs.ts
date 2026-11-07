export type JobState = 'espera' | 'lavando' | 'listo' | 'entregado';
export type VehicleType = 'auto' | 'moto';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'pendiente';

export interface JobExtra {
  id: string;
  nombre: string;
  precio: number; // en Gs.
  icono?: string;
}

export interface Job {
  id: string;
  business_id?: string;
  vehicle_id?: string | null;
  plate: string;
  tipo: VehicleType;
  marca?: string | null;
  service_id?: string | null;
  service: string;
  extras: JobExtra[];
  amount: number; // en Gs.
  state: JobState;
  payment_method: PaymentMethod | null;
  token_publico: string;
  notas?: string | null;
  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  inicio_lavado?: string | null;
  listo_en?: string | null;
  entregado_en?: string | null;
  created_at: string;
}

export const states: JobState[] = ['espera', 'lavando', 'listo', 'entregado'];

export const labels: Record<JobState, string> = {
  espera: 'En espera',
  lavando: 'Lavando',
  listo: 'Listos para entrega',
  entregado: 'Entregados',
};

export function generateJobToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    return 'tk_' + Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return 'tk_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

export function formatPlate(val: string): string {
  return (val || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function validJob(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  const plate = typeof data.plate === 'string' ? data.plate.trim().toUpperCase() : '';
  if (!/^[A-Z0-9 -]{3,15}$/.test(plate)) return false;

  const service = typeof data.service === 'string' ? data.service.trim() : '';
  if (service.length < 2 || service.length > 80) return false;

  if (!Number.isSafeInteger(data.amount) || data.amount <= 0 || data.amount > 100000000) {
    return false;
  }

  if (data.tipo && !['auto', 'moto'].includes(data.tipo)) {
    return false;
  }

  if (data.extras && !Array.isArray(data.extras)) {
    return false;
  }

  return true;
}

export function canAdvance(from: JobState, to: JobState): boolean {
  const fromIndex = states.indexOf(from);
  const toIndex = states.indexOf(to);
  return fromIndex >= 0 && toIndex === fromIndex + 1;
}

export function formatGs(amount: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0,
  }).format(amount);
}
