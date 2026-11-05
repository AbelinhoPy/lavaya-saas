'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Brand } from './brand';
import { Job, JobState, labels, states, canAdvance, validJob, formatGs, formatPlate, generateJobToken, JobExtra, VehicleType, PaymentMethod } from '@/lib/jobs';
import { Car, Bike, Sparkles, Check, ArrowRight, ShieldCheck, Wallet, DollarSign, PlusCircle, Copy, ExternalLink, RefreshCw, AlertCircle, Clock, Banknote, Landmark } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ServiceItem {
  id: string;
  tipo_vehiculo: 'auto' | 'moto' | 'ambos';
  categoria: 'base' | 'extra';
  nombre: string;
  descripcion?: string;
  icono: string;
  precio: number;
  activo: boolean;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  { id: 's-1', tipo_vehiculo: 'auto', categoria: 'base', nombre: 'Lavado Completo Auto', descripcion: 'Carrocería exterior + aspirado de habitáculo', icono: '🚗', precio: 50000, activo: true },
  { id: 's-2', tipo_vehiculo: 'auto', categoria: 'base', nombre: 'Lavado Básico Exterior', descripcion: 'Lavado a presión y secado', icono: '🚿', precio: 35000, activo: true },
  { id: 's-3', tipo_vehiculo: 'auto', categoria: 'base', nombre: 'Lavado Premium + Cera', descripcion: 'Lavado completo, cera a mano y silicona', icono: '✨', precio: 80000, activo: true },
  { id: 's-4', tipo_vehiculo: 'moto', categoria: 'base', nombre: 'Lavado Completo Moto', descripcion: 'Desengrasado, lavado de cadena y secado', icono: '🏍️', precio: 25000, activo: true },
  { id: 's-5', tipo_vehiculo: 'ambos', categoria: 'extra', nombre: 'Encerado Carnauba Líquida', descripcion: 'Brillo y protección de pintura', icono: '🧽', precio: 30000, activo: true },
  { id: 's-6', tipo_vehiculo: 'ambos', categoria: 'extra', nombre: 'Limpieza Profunda Tapizado', descripcion: 'Higienización y remoción de manchas', icono: '🧼', precio: 60000, activo: true },
  { id: 's-7', tipo_vehiculo: 'ambos', categoria: 'extra', nombre: 'Silicona y Perfume Premium', descripcion: 'Neumáticos, plásticos y fragancia', icono: '🧴', precio: 15000, activo: true },
];

function sampleJobs(): Job[] {
  return [
    {
      id: 'demo-1',
      plate: 'BCF 482',
      tipo: 'auto',
      marca: 'Toyota Corolla',
      service: 'Lavado Completo Auto',
      extras: [{ id: 's-5', nombre: 'Encerado Carnauba Líquida', precio: 30000, icono: '🧽' }],
      amount: 80000,
      state: 'lavando',
      payment_method: null,
      token_publico: 'tk_demo_corolla',
      notas: 'Cuidado con el espejo lateral derecho.',
      cliente_nombre: 'Martín Benítez',
      cliente_telefono: '0981 123 456',
      inicio_lavado: new Date(Date.now() - 15 * 60000).toISOString(),
      created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: 'demo-2',
      plate: 'AAKD 793',
      tipo: 'auto',
      marca: 'Kia Sportage',
      service: 'Lavado Básico Exterior',
      extras: [],
      amount: 35000,
      state: 'espera',
      payment_method: null,
      token_publico: 'tk_demo_kia',
      cliente_nombre: 'Carla Duarte',
      cliente_telefono: '0971 789 012',
      created_at: new Date(Date.now() - 10 * 60000).toISOString(),
    },
    {
      id: 'demo-3',
      plate: 'BCD 165',
      tipo: 'moto',
      marca: 'Honda CB 190',
      service: 'Lavado Completo Moto',
      extras: [{ id: 's-7', nombre: 'Silicona y Perfume Premium', precio: 15000, icono: '🧴' }],
      amount: 40000,
      state: 'listo',
      payment_method: null,
      token_publico: 'tk_demo_honda',
      listo_en: new Date(Date.now() - 5 * 60000).toISOString(),
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    },
    {
      id: 'demo-4',
      plate: 'AAL 520',
      tipo: 'auto',
      marca: 'Hyundai HB20',
      service: 'Lavado Completo Auto',
      extras: [],
      amount: 50000,
      state: 'entregado',
      payment_method: 'efectivo',
      token_publico: 'tk_demo_hyundai',
      entregado_en: new Date(Date.now() - 120 * 60000).toISOString(),
      created_at: new Date(Date.now() - 180 * 60000).toISOString(),
    },
  ];
}

export default function Board({
  demo,
  initialJobs = [],
  initialServices = DEFAULT_SERVICES,
  title = 'Tu lavadero',
  children,
}: {
  demo: boolean;
  initialJobs?: Job[];
  initialServices?: ServiceItem[];
  title?: string;
  children?: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<'pista' | 'caja' | 'servicios'>('pista');
  const [jobs, setJobs] = useState<Job[]>(demo ? sampleJobs() : initialJobs);
  const [services, setServices] = useState<ServiceItem[]>(initialServices.length > 0 ? initialServices : DEFAULT_SERVICES);
  const [expenses, setExpenses] = useState<{ id: string; concepto: string; monto: number; categoria: string; fecha: string }[]>([
    { id: 'exp-1', concepto: 'Champú para espuma activa (bidón 20L)', monto: 120000, categoria: 'insumos', fecha: new Date().toISOString() },
    { id: 'exp-2', concepto: 'Paño microfibra secado (pack x3)', monto: 35000, categoria: 'insumos', fecha: new Date().toISOString() },
  ]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Reception form state
  const [tipo, setTipo] = useState<VehicleType>('auto');
  const [plate, setPlate] = useState('');
  const [marca, setMarca] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<JobExtra[]>([]);
  const [notas, setNotas] = useState('');
  const [showReceptionModal, setShowReceptionModal] = useState(false);

  // Delivery & payment modal state
  const [jobForPayment, setJobForPayment] = useState<Job | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<PaymentMethod>('efectivo');

  // New expense form state
  const [gastoConcepto, setGastoConcepto] = useState('');
  const [gastoMonto, setGastoMonto] = useState('');
  const [gastoCat, setGastoCat] = useState('insumos');

  // Available base services filtered by vehicle type
  const baseServices = useMemo(() => {
    return services.filter((s) => s.activo && s.categoria === 'base' && (s.tipo_vehiculo === tipo || s.tipo_vehiculo === 'ambos'));
  }, [services, tipo]);

  const extraServices = useMemo(() => {
    return services.filter((s) => s.activo && s.categoria === 'extra');
  }, [services]);

  // Current active service calculation
  const currentService = useMemo(() => {
    return baseServices.find((s) => s.id === selectedServiceId) || baseServices[0];
  }, [baseServices, selectedServiceId]);

  const currentTotal = useMemo(() => {
    const base = currentService?.precio || 0;
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.precio, 0);
    return base + extrasTotal;
  }, [currentService, selectedExtras]);

  // Daily summary calculations
  const deliveredJobs = useMemo(() => jobs.filter((j) => j.state === 'entregado'), [jobs]);
  const effectivePaid = useMemo(() => deliveredJobs.filter((j) => j.payment_method === 'efectivo'), [deliveredJobs]);
  const transferPaid = useMemo(() => deliveredJobs.filter((j) => j.payment_method === 'transferencia'), [deliveredJobs]);
  const pendingJobs = useMemo(() => deliveredJobs.filter((j) => j.payment_method === 'pendiente'), [deliveredJobs]);

  const totalEfectivo = useMemo(() => effectivePaid.reduce((sum, j) => sum + j.amount, 0), [effectivePaid]);
  const totalTransferencia = useMemo(() => transferPaid.reduce((sum, j) => sum + j.amount, 0), [transferPaid]);
  const totalCobrado = totalEfectivo + totalTransferencia;
  const totalPendiente = useMemo(() => pendingJobs.reduce((sum, j) => sum + j.amount, 0), [pendingJobs]);
  const totalGastos = useMemo(() => expenses.reduce((sum, e) => sum + e.monto, 0), [expenses]);
  const balanceOperativo = totalCobrado - totalGastos;

  // Handle vehicle registration
  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    const cleanPlate = formatPlate(plate);
    if (cleanPlate.length < 3) {
      setMessage('Ingresá una placa válida (mínimo 3 caracteres).');
      return;
    }
    if (!currentService) {
      setMessage('Seleccioná un servicio base para el vehículo.');
      return;
    }

    const payload = {
      plate: cleanPlate,
      tipo,
      marca: marca.trim() || undefined,
      service: currentService.nombre,
      service_id: currentService.id,
      extras: selectedExtras,
      amount: currentTotal,
      cliente_nombre: clienteNombre.trim() || undefined,
      cliente_telefono: clienteTelefono.trim() || undefined,
      notas: notas.trim() || undefined,
    };

    if (!validJob(payload)) {
      setMessage('Datos inválidos. Verificá placa, servicio e importes.');
      return;
    }

    setBusy(true);
    try {
      if (demo) {
        const newJob: Job = {
          ...payload,
          id: 'demo-' + Date.now(),
          state: 'espera',
          payment_method: null,
          token_publico: generateJobToken(),
          created_at: new Date().toISOString(),
        };
        setJobs((prev) => [newJob, ...prev]);
        setMessage(`Vehículo ${cleanPlate} registrado en la pista (Modo Demo).`);
      } else {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No pudimos registrar el vehículo.');
        setJobs((prev) => [data.job, ...prev]);
        setMessage(`Vehículo ${cleanPlate} registrado con éxito.`);
      }

      // Reset form
      setPlate('');
      setMarca('');
      setClienteNombre('');
      setClienteTelefono('');
      setNotas('');
      setSelectedExtras([]);
      setShowReceptionModal(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      setBusy(false);
    }
  }

  // Handle advancing state
  async function handleAdvance(job: Job) {
    const nextIndex = states.indexOf(job.state) + 1;
    const nextState = states[nextIndex];
    if (!canAdvance(job.state, nextState)) return;

    // If next state is entregado, open payment selection modal
    if (nextState === 'entregado') {
      setJobForPayment(job);
      return;
    }

    setBusy(true);
    try {
      if (demo) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  state: nextState,
                  inicio_lavado: nextState === 'lavando' ? new Date().toISOString() : j.inicio_lavado,
                  listo_en: nextState === 'listo' ? new Date().toISOString() : j.listo_en,
                }
              : j
          )
        );
        setMessage(nextState === 'lavando' ? `Vehículo ${job.plate} en lavado.` : `Vehículo ${job.plate} listo.`);
      } else {
        const res = await fetch('/api/jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: job.id, state: nextState }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No pudimos actualizar el estado.');
        setJobs((prev) => prev.map((j) => (j.id === data.job.id ? data.job : j)));
        setMessage(`Estado actualizado a ${labels[nextState]}.`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al actualizar.');
    } finally {
      setBusy(false);
    }
  }

  // Confirm payment & delivery
  async function confirmDeliveryAndPay() {
    if (!jobForPayment) return;
    setBusy(true);
    try {
      if (demo) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobForPayment.id
              ? {
                  ...j,
                  state: 'entregado',
                  payment_method: paymentChoice,
                  entregado_en: new Date().toISOString(),
                }
              : j
          )
        );
        setMessage(`Entrega y cobro registrados: ${jobForPayment.plate} (${paymentChoice.toUpperCase()}).`);
      } else {
        const res = await fetch('/api/jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: jobForPayment.id,
            state: 'entregado',
            payment_method: paymentChoice,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No pudimos registrar la entrega.');
        setJobs((prev) => prev.map((j) => (j.id === data.job.id ? data.job : j)));
        setMessage(`Entrega y cobro asentados en la caja: ${jobForPayment.plate}.`);
      }

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {}

      setJobForPayment(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al entregar.');
    } finally {
      setBusy(false);
    }
  }

  // Add expense
  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    const monto = parseInt(gastoMonto.replace(/\D/g, ''), 10);
    if (!gastoConcepto.trim() || isNaN(monto) || monto <= 0) {
      setMessage('Ingresá el concepto y el monto del gasto.');
      return;
    }

    setBusy(true);
    try {
      if (demo) {
        setExpenses((prev) => [
          {
            id: 'exp-' + Date.now(),
            concepto: gastoConcepto.trim(),
            monto,
            categoria: gastoCat,
            fecha: new Date().toISOString(),
          },
          ...prev,
        ]);
        setMessage('Gasto registrado en la caja (Modo Demo).');
      } else {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concepto: gastoConcepto.trim(), monto, categoria: gastoCat }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No pudimos anotar el gasto.');
        setExpenses((prev) => [data.expense, ...prev]);
        setMessage('Gasto anotado en la caja.');
      }
      setGastoConcepto('');
      setGastoMonto('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al anotar gasto.');
    } finally {
      setBusy(false);
    }
  }

  // Edit service price
  async function handleUpdatePrice(id: string, newPrice: number) {
    if (newPrice < 0 || isNaN(newPrice)) return;
    setBusy(true);
    try {
      if (demo) {
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, precio: newPrice } : s)));
        setMessage('Precio actualizado en la demo.');
      } else {
        const res = await fetch('/api/services', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, precio: newPrice }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No pudimos actualizar el precio.');
        setServices((prev) => prev.map((s) => (s.id === data.service.id ? data.service : s)));
        setMessage('Tarifa actualizada correctamente en Neon.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al actualizar precio.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      {/* Top Header */}
      <header className="app-header">
        <Brand />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {demo ? (
            <>
              <span className="pill" style={{ background: '#eef6d8', color: '#2a5538' }}>
                DEMO INTERACTIVA · DATOS FICTICIOS
              </span>
              <Link className="button small" href="/registro">
                Activar con mi lavadero ↗
              </Link>
            </>
          ) : (
            <button
              className="subtle"
              onClick={async () => {
                await fetch('/api/auth', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mode: 'logout' }),
                });
                window.location.assign('/');
              }}
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </header>

      {/* Main Title & Navigation */}
      <div className="app-title" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="eyebrow">
            <span /> CENTRO DE OPERACIONES
          </div>
          <h1 style={{ margin: '4px 0' }}>{demo ? 'Probá el sistema en vivo' : title}</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            {demo
              ? 'Mové vehículos, probá cobros y explorá la caja. Los cambios son locales y no alteran la base de datos.'
              : 'Gestión integral: Pista, Cobros en Guaraníes, Gastos y Clientes.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {demo && (
            <button
              className="subtle"
              onClick={() => {
                setJobs(sampleJobs());
                setMessage('Demo reiniciada con vehículos de ejemplo.');
              }}
            >
              <RefreshCw size={14} style={{ display: 'inline', marginRight: 5 }} /> Reiniciar demo
            </button>
          )}

          <button
            className="button"
            onClick={() => setShowReceptionModal(true)}
            style={{ gap: 8 }}
          >
            <PlusCircle size={18} /> + Nuevo vehículo
          </button>
        </div>
      </div>

      {/* Embedded Billing Banner / Status */}
      {children}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, margin: '22px 0 16px', borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('pista')}
          style={{
            padding: '9px 18px',
            borderRadius: 8,
            border: 0,
            background: activeTab === 'pista' ? 'var(--ink)' : 'transparent',
            color: activeTab === 'pista' ? 'white' : 'var(--ink)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          🚘 Pista de lavado ({jobs.filter((j) => j.state !== 'entregado').length})
        </button>

        <button
          onClick={() => setActiveTab('caja')}
          style={{
            padding: '9px 18px',
            borderRadius: 8,
            border: 0,
            background: activeTab === 'caja' ? 'var(--ink)' : 'transparent',
            color: activeTab === 'caja' ? 'white' : 'var(--ink)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          💰 Caja y Gastos del Día
        </button>

        <button
          onClick={() => setActiveTab('servicios')}
          style={{
            padding: '9px 18px',
            borderRadius: 8,
            border: 0,
            background: activeTab === 'servicios' ? 'var(--ink)' : 'transparent',
            color: activeTab === 'servicios' ? 'white' : 'var(--ink)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ⚙️ Servicios y Tarifas ({services.length})
        </button>
      </div>

      {/* System Notification Message */}
      {message && (
        <p className="notice" role="status" style={{ margin: '12px 0' }}>
          {message}
        </p>
      )}

      {/* TAB 1: PISTA DE LAVADO (KANBAN BOARD) */}
      {activeTab === 'pista' && (
        <>
          <div className="stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="stat">
              <small>Vehículos en pista</small>
              <strong>{jobs.filter((j) => j.state !== 'entregado').length}</strong>
            </div>
            <div className="stat">
              <small>Cobrado hoy en pista</small>
              <strong style={{ color: '#2b7147' }}>{formatGs(totalCobrado)}</strong>
            </div>
            <div className="stat">
              <small>Entregas realizadas</small>
              <strong>{deliveredJobs.length}</strong>
            </div>
            {totalPendiente > 0 && (
              <div className="stat" style={{ borderLeft: '4px solid #f59e0b' }}>
                <small style={{ color: '#b45309' }}>Pendiente de cobro</small>
                <strong style={{ color: '#b45309' }}>{formatGs(totalPendiente)}</strong>
              </div>
            )}
          </div>

          <div className="board-grid">
            {states.map((state) => {
              const stateJobs = jobs.filter((j) => j.state === state);
              return (
                <section className="board-column" key={state}>
                  <h2 className="column-title">
                    {labels[state]}
                    <span>{stateJobs.length}</span>
                  </h2>

                  {stateJobs.map((job) => (
                    <article className="job" key={job.id} style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 16 }}>{job.tipo === 'moto' ? '🏍️' : '🚗'}</span>
                            <h3 style={{ margin: 0, fontSize: 16 }}>{job.plate}</h3>
                          </div>
                          {job.marca && <small style={{ color: 'var(--muted)', display: 'block', marginTop: 2 }}>{job.marca}</small>}
                        </div>

                        <span className="pill" style={{ fontSize: 9 }}>
                          {formatGs(job.amount)}
                        </span>
                      </div>

                      <p style={{ margin: '10px 0 6px', fontSize: 12 }}>
                        <strong>{job.service}</strong>
                      </p>

                      {job.extras && job.extras.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '6px 0 10px' }}>
                          {job.extras.map((ex) => (
                            <span key={ex.id} style={{ fontSize: 10, background: '#f0f4ea', padding: '2px 6px', borderRadius: 4, color: '#3f5945' }}>
                              +{ex.nombre}
                            </span>
                          ))}
                        </div>
                      )}

                      {job.cliente_nombre && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0' }}>
                          👤 {job.cliente_nombre} {job.cliente_telefono ? `· ${job.cliente_telefono}` : ''}
                        </div>
                      )}

                      {job.notas && (
                        <div style={{ fontSize: 11, fontStyle: 'italic', background: '#fafbf7', padding: '4px 8px', borderRadius: 4, margin: '6px 0', border: '1px solid #edf1ea' }}>
                          📝 {job.notas}
                        </div>
                      )}

                      {/* Public token tracking link for customer */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #edf1ea', fontSize: 10, color: 'var(--muted)' }}>
                        <span>Tracking cliente:</span>
                        <Link
                          href={`/estado/${job.token_publico}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2b7147', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'underline' }}
                        >
                          Ver seguimiento <ExternalLink size={10} />
                        </Link>
                      </div>

                      {/* State action button */}
                      {job.state !== 'entregado' ? (
                        <button
                          disabled={busy}
                          onClick={() => handleAdvance(job)}
                          style={{
                            marginTop: 12,
                            padding: '10px',
                            fontWeight: 600,
                            borderRadius: 6,
                            border: '1px solid #d4e4cc',
                            background: job.state === 'listo' ? '#d4ef7b' : '#ecf3df',
                            color: 'var(--ink)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          {job.state === 'espera' && 'Empezar lavado →'}
                          {job.state === 'lavando' && 'Marcar listo para entrega ✓'}
                          {job.state === 'listo' && 'Cobrar y entregar ✨'}
                        </button>
                      ) : (
                        <div style={{ marginTop: 12, padding: '8px', background: '#edf5eb', borderRadius: 6, textAlign: 'center', fontSize: 11, color: '#2f603c' }}>
                          ✓ Entregado ·{' '}
                          <strong>
                            {job.payment_method === 'efectivo'
                              ? 'Efectivo 💵'
                              : job.payment_method === 'transferencia'
                              ? 'Transferencia 📱'
                              : 'Pago pendiente ⏳'}
                          </strong>
                        </div>
                      )}
                    </article>
                  ))}

                  {stateJobs.length === 0 && <p className="empty">Sin vehículos en esta etapa.</p>}
                </section>
              );
            })}
          </div>
        </>
      )}

      {/* TAB 2: CAJA Y GASTOS DEL DÍA */}
      {activeTab === 'caja' && (
        <div style={{ marginTop: 15 }}>
          <div className="stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            <div className="stat">
              <small>Total Cobrado Hoy</small>
              <strong style={{ color: '#20633b' }}>{formatGs(totalCobrado)}</strong>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {effectivePaid.length + transferPaid.length} vehículos cobrados
              </div>
            </div>

            <div className="stat">
              <small>Cobros en Efectivo</small>
              <strong>{formatGs(totalEfectivo)}</strong>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {effectivePaid.length} cobros en mano
              </div>
            </div>

            <div className="stat">
              <small>Cobros por Transferencia</small>
              <strong>{formatGs(totalTransferencia)}</strong>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {transferPaid.length} transferencias bancarias
              </div>
            </div>

            <div className="stat">
              <small style={{ color: '#b45309' }}>Cobros Pendientes</small>
              <strong style={{ color: '#b45309' }}>{formatGs(totalPendiente)}</strong>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {pendingJobs.length} entregas a cobrar luego
              </div>
            </div>

            <div className="stat">
              <small>Gastos Anotados Hoy</small>
              <strong style={{ color: '#b91c1c' }}>{formatGs(totalGastos)}</strong>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {expenses.length} compras / egresos
              </div>
            </div>

            <div className="stat" style={{ background: '#f2f7ec', border: '2px solid #d4ef7b' }}>
              <small style={{ fontWeight: 700, color: 'var(--ink)' }}>Cobros menos gastos registrados</small>
              <strong style={{ color: balanceOperativo >= 0 ? '#1b4d2e' : '#b91c1c' }}>
                {formatGs(balanceOperativo)}
              </strong>
              <div style={{ fontSize: 10, color: '#576c5b', marginTop: 4, lineHeight: 1.4 }}>
                Balance operativo de caja del día. No contempla costos fijos, alquiler ni sueldos no ingresados.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 24 }}>
            {/* Form to log expense */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: 22 }}>
              <h3 style={{ fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wallet size={18} /> Registrar gasto menor de caja
              </h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
                Anotá compras de champú, bolsas, café o insumos del día para mantener el balance real de caja.
              </p>

              <form onSubmit={handleAddExpense} style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Concepto del gasto
                  <input
                    value={gastoConcepto}
                    onChange={(e) => setGastoConcepto(e.target.value)}
                    placeholder="Ej: Champú siliconado 5L"
                    required
                    style={{ padding: 10, border: '1px solid #d1dcd0', borderRadius: 6 }}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                  <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                    Monto en Gs.
                    <input
                      type="number"
                      value={gastoMonto}
                      onChange={(e) => setGastoMonto(e.target.value)}
                      placeholder="50000"
                      min={100}
                      step={100}
                      required
                      style={{ padding: 10, border: '1px solid #d1dcd0', borderRadius: 6 }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                    Categoría
                    <select
                      value={gastoCat}
                      onChange={(e) => setGastoCat(e.target.value)}
                      style={{ padding: 10, border: '1px solid #d1dcd0', borderRadius: 6 }}
                    >
                      <option value="insumos">Insumos lavado</option>
                      <option value="servicios">Servicios (luz/agua)</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="varios">Varios / Caja chica</option>
                    </select>
                  </label>
                </div>

                <button className="button" disabled={busy} style={{ marginTop: 8 }}>
                  + Anotar gasto en caja
                </button>
              </form>
            </div>

            {/* Expenses history */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: 22 }}>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Gastos asentados hoy</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                Movimientos que descuentan del efectivo o disponible de la jornada.
              </p>

              <div style={{ display: 'grid', gap: 8 }}>
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#fafbf8',
                      border: '1px solid #edf1ea',
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 13, display: 'block' }}>{exp.concepto}</strong>
                      <small style={{ color: 'var(--muted)', textTransform: 'capitalize' }}>{exp.categoria}</small>
                    </div>
                    <span style={{ fontWeight: 700, color: '#b91c1c', fontSize: 14 }}>
                      -{formatGs(exp.monto)}
                    </span>
                  </div>
                ))}

                {expenses.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: 20 }}>
                    No hay gastos registrados hoy.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICIOS Y TARIFAS */}
      {activeTab === 'servicios' && (
        <div style={{ marginTop: 15, background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 6 }}>Servicios y Precios configurados</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Configurá las tarifas en Guaraníes (Gs.) para tu lavadero. Los cambios se aplican automáticamente a las nuevas recepciones.
          </p>

          <div style={{ display: 'grid', gap: 10 }}>
            {services.map((svc) => (
              <div
                key={svc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: '#fafbf7',
                  border: '1px solid #e7ede4',
                  borderRadius: 10,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{svc.icono}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 14 }}>{svc.nombre}</strong>
                      <span className="pill" style={{ fontSize: 9 }}>
                        {svc.categoria === 'base' ? `Base · ${svc.tipo_vehiculo}` : 'Adicional / Extra'}
                      </span>
                    </div>
                    {svc.descripcion && (
                      <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginTop: 2 }}>
                        {svc.descripcion}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#245b4d' }}>
                    {formatGs(svc.precio)}
                  </span>
                  <button
                    className="subtle"
                    onClick={() => {
                      const nuevo = window.prompt(`Nuevo precio para ${svc.nombre} en Gs.:`, svc.precio.toString());
                      if (nuevo) {
                        const parsed = parseInt(nuevo.replace(/\D/g, ''), 10);
                        if (!isNaN(parsed) && parsed >= 0) handleUpdatePrice(svc.id, parsed);
                      }
                    }}
                    style={{ fontSize: 11, padding: '6px 10px' }}
                  >
                    Editar tarifa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: RECEPTION / ALTA DE VEHICULO */}
      {showReceptionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 33, 27, 0.75)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 22, margin: 0, letterSpacing: '-0.5px' }}>🚗 Nuevo ingreso a pista</h2>
              <button
                onClick={() => setShowReceptionModal(false)}
                style={{ border: 0, background: 'transparent', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVehicle} style={{ display: 'grid', gap: 14 }}>
              {/* Vehicle Type Switcher */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setTipo('auto')}
                  style={{
                    padding: '10px',
                    borderRadius: 8,
                    border: tipo === 'auto' ? '2px solid #366c52' : '1px solid var(--line)',
                    background: tipo === 'auto' ? '#edf5eb' : '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Car size={18} /> Auto / Camioneta
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('moto')}
                  style={{
                    padding: '10px',
                    borderRadius: 8,
                    border: tipo === 'moto' ? '2px solid #366c52' : '1px solid var(--line)',
                    background: tipo === 'moto' ? '#edf5eb' : '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Bike size={18} /> Moto
                </button>
              </div>

              {/* Plate & Brand */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Placa / Chapa *
                  <input
                    value={plate}
                    onChange={(e) => setPlate(formatPlate(e.target.value))}
                    placeholder="Ej: BCF 482"
                    required
                    maxLength={15}
                    style={{ padding: 11, border: '1px solid #ccd8c8', borderRadius: 7, textTransform: 'uppercase', fontWeight: 700 }}
                  />
                </label>

                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Marca / Modelo
                  <input
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Ej: Corolla gris"
                    style={{ padding: 11, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  />
                </label>
              </div>

              {/* Service Base Selection */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Servicio de lavado base *
                </label>
                <div style={{ display: 'grid', gap: 6 }}>
                  {baseServices.map((svc) => {
                    const isSelected = (currentService?.id === svc.id);
                    return (
                      <div
                        key={svc.id}
                        onClick={() => setSelectedServiceId(svc.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: isSelected ? '2px solid #366c52' : '1px solid #dde5da',
                          background: isSelected ? '#edf5eb' : '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{svc.icono}</span>
                          <div>
                            <strong style={{ fontSize: 13 }}>{svc.nombre}</strong>
                            {svc.descripcion && <small style={{ color: 'var(--muted)', display: 'block' }}>{svc.descripcion}</small>}
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#1f503e' }}>{formatGs(svc.precio)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extras Selection */}
              {extraServices.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Adicionales opcionales
                  </label>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {extraServices.map((ex) => {
                      const isChecked = selectedExtras.some((e) => e.id === ex.id);
                      return (
                        <label
                          key={ex.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: isChecked ? '1px solid #7ea88f' : '1px solid #e5ebe2',
                            background: isChecked ? '#f4f8f2' : '#fff',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExtras((prev) => [...prev, { id: ex.id, nombre: ex.nombre, precio: ex.precio, icono: ex.icono }]);
                                } else {
                                  setSelectedExtras((prev) => prev.filter((p) => p.id !== ex.id));
                                }
                              }}
                            />
                            {ex.icono} {ex.nombre}
                          </span>
                          <span style={{ fontWeight: 600, color: '#38634e' }}>+{formatGs(ex.precio)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customer Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Nombre cliente
                  <input
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Ej: Alberto Gómez"
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Teléfono / WhatsApp
                  <input
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    placeholder="0981 000 000"
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  />
                </label>
              </div>

              {/* Notes */}
              <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                Notas de recepción (opcional)
                <input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Detalles del estado o pertenencias dejadas en el auto..."
                  style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                />
              </label>

              {/* Total & Submit */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: '1px solid var(--line)', marginTop: 8 }}>
                <div>
                  <small style={{ color: 'var(--muted)', display: 'block' }}>TOTAL ENTRADA</small>
                  <strong style={{ fontSize: 20, color: 'var(--ink)' }}>{formatGs(currentTotal)}</strong>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="subtle" onClick={() => setShowReceptionModal(false)}>
                    Cancelar
                  </button>
                  <button className="button" disabled={busy}>
                    + Ingresar a pista
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAR ENTREGA Y COBRO */}
      {jobForPayment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 33, 27, 0.75)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              width: '100%',
              maxWidth: 440,
              padding: 28,
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>💳 Cobrar y entregar vehículo</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 18px' }}>
              Vehículo: <strong>{jobForPayment.plate}</strong> · {jobForPayment.service}
            </p>

            <div style={{ background: '#f2f6ee', borderRadius: 10, padding: 16, textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Total a cobrar
              </span>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#18473b', marginTop: 4 }}>
                {formatGs(jobForPayment.amount)}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                Medio de cobro:
              </label>

              <div style={{ display: 'grid', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPaymentChoice('efectivo')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: paymentChoice === 'efectivo' ? '2px solid #2d6b49' : '1px solid var(--line)',
                    background: paymentChoice === 'efectivo' ? '#edf6eb' : '#fff',
                    textAlign: 'left',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Banknote size={20} color="#2d6b49" />
                  <div>
                    <div style={{ fontSize: 14 }}>Efectivo (en mano)</div>
                    <small style={{ color: 'var(--muted)', fontWeight: 400 }}>Suma a la caja física</small>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChoice('transferencia')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: paymentChoice === 'transferencia' ? '2px solid #2d6b49' : '1px solid var(--line)',
                    background: paymentChoice === 'transferencia' ? '#edf6eb' : '#fff',
                    textAlign: 'left',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Landmark size={20} color="#2d6b49" />
                  <div>
                    <div style={{ fontSize: 14 }}>Transferencia Bancaria / QR</div>
                    <small style={{ color: 'var(--muted)', fontWeight: 400 }}>SIPAP / Tigo Money / Banco</small>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChoice('pendiente')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: paymentChoice === 'pendiente' ? '2px solid #b45309' : '1px solid var(--line)',
                    background: paymentChoice === 'pendiente' ? '#fef3c7' : '#fff',
                    textAlign: 'left',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Clock size={20} color="#b45309" />
                  <div>
                    <div style={{ fontSize: 14, color: '#92400e' }}>Pago Pendiente (a cobrar luego)</div>
                    <small style={{ color: '#b45309', fontWeight: 400 }}>No cuenta como dinero en caja todavía</small>
                  </div>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="subtle" onClick={() => setJobForPayment(null)}>
                Volver
              </button>
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={confirmDeliveryAndPay}
              >
                Confirmar entrega ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
