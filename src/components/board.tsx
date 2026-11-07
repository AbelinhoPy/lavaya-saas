'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Brand } from './brand';
import { Job, JobState, labels, states, canAdvance, validJob, formatGs, formatPlate, generateJobToken, JobExtra, VehicleType, PaymentMethod } from '@/lib/jobs';
import { Car, Bike, Sparkles, Check, ArrowRight, ShieldCheck, Wallet, DollarSign, PlusCircle, Copy, ExternalLink, RefreshCw, AlertCircle, Clock, Banknote, Landmark, Download, Package, AlertTriangle, Layers, ArrowUpRight, Users, Phone, TrendingUp, BarChart3, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface StockItem {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor?: string;
  is_active?: boolean;
}

export interface CashSessionData {
  id: string;
  opened_by: string;
  fondo_inicial: number;
  opened_at: string;
  status: 'open' | 'closed';
  closed_at?: string;
  efectivo_esperado?: number;
  efectivo_contado?: number;
  diferencia?: number;
  notas?: string;
  cashSales?: number;
  cashExpenses?: number;
  expectedCash?: number;
}

const DEFAULT_STOCK_ITEMS: StockItem[] = [
  { id: 'stk-1', nombre: 'Champú Ph Neutro Espuma Activa', categoria: 'quimico', unidad: 'L', stock_actual: 15, stock_minimo: 5, costo_unitario: 35000 },
  { id: 'stk-2', nombre: 'Cera Líquida Carnauba', categoria: 'quimico', unidad: 'L', stock_actual: 3, stock_minimo: 4, costo_unitario: 55000 },
  { id: 'stk-3', nombre: 'Desengrasante Motor/Chasis', categoria: 'quimico', unidad: 'L', stock_actual: 8, stock_minimo: 4, costo_unitario: 28000 },
  { id: 'stk-4', nombre: 'Silicona Abrillantadora Cubiertas', categoria: 'quimico', unidad: 'L', stock_actual: 2, stock_minimo: 3, costo_unitario: 42000 },
  { id: 'stk-5', nombre: 'Paños Microfibra 40x40', categoria: 'accesorio', unidad: 'unidades', stock_actual: 22, stock_minimo: 10, costo_unitario: 12000 },
];

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
  userRole = 'owner',
  children,
}: {
  demo: boolean;
  initialJobs?: Job[];
  initialServices?: ServiceItem[];
  title?: string;
  userRole?: 'owner' | 'operator';
  children?: React.ReactNode;
}) {
  const isOperator = userRole === 'operator';
  const [activeTab, setActiveTab] = useState<'resumen' | 'pista' | 'caja' | 'stock' | 'clientes' | 'servicios'>(
    isOperator ? 'pista' : 'resumen'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>(demo ? sampleJobs() : initialJobs);
  const [services, setServices] = useState<ServiceItem[]>(initialServices.length > 0 ? initialServices : DEFAULT_SERVICES);
  const [expenses, setExpenses] = useState<{ id: string; concepto: string; monto: number; categoria: string; fecha: string }[]>([
    { id: 'exp-1', concepto: 'Champú para espuma activa (bidón 20L)', monto: 120000, categoria: 'insumos', fecha: new Date().toISOString() },
    { id: 'exp-2', concepto: 'Paño microfibra secado (pack x3)', monto: 35000, categoria: 'insumos', fecha: new Date().toISOString() },
  ]);
  const [stockItems, setStockItems] = useState<StockItem[]>(demo ? DEFAULT_STOCK_ITEMS : []);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [compraCantidad, setCompraCantidad] = useState('');
  const [compraCosto, setCompraCosto] = useState('');
  const [compraProveedor, setCompraProveedor] = useState('');
  const [compraNotas, setCompraNotas] = useState('');
  const [compraMedioPago, setCompraMedioPago] = useState<'efectivo' | 'transferencia' | 'pendiente'>('efectivo');

  // Manual stock adjustment state
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [ajusteItem, setAjusteItem] = useState<StockItem | null>(null);
  const [ajusteNuevoStock, setAjusteNuevoStock] = useState('');
  const [ajusteMotivo, setAjusteMotivo] = useState('');

  // New custom stock item modal
  const [showNuevoInsumoModal, setShowNuevoInsumoModal] = useState(false);
  const [nuevoInsumoNombre, setNuevoInsumoNombre] = useState('');
  const [nuevoInsumoCategoria, setNuevoInsumoCategoria] = useState('quimico');
  const [nuevoInsumoUnidad, setNuevoInsumoUnidad] = useState('L');
  const [nuevoInsumoStockMin, setNuevoInsumoStockMin] = useState('5');
  const [nuevoInsumoStockAct, setNuevoInsumoStockAct] = useState('0');
  const [nuevoInsumoCostoUnit, setNuevoInsumoCostoUnit] = useState('0');
  const [nuevoInsumoProveedor, setNuevoInsumoProveedor] = useState('');

  // Clientes search state
  const [searchCliente, setSearchCliente] = useState('');

  // Cash session state (Arqueo y control físico)
  const [cashSession, setCashSession] = useState<CashSessionData | null>(
    demo
      ? {
          id: 'cs-demo',
          opened_by: 'Abel Núñez',
          fondo_inicial: 200000,
          opened_at: new Date().toISOString(),
          status: 'open',
          cashSales: 50000,
          cashExpenses: 155000,
          expectedCash: 95000,
        }
      : null
  );
  const [showSessionModal, setShowSessionModal] = useState<'abrir' | 'cerrar' | null>(null);
  const [sessionFondoInicial, setSessionFondoInicial] = useState('200000');
  const [sessionEfectivoContado, setSessionEfectivoContado] = useState('');
  const [sessionNotas, setSessionNotas] = useState('');

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (demo) return;
    fetch('/api/stock')
      .then((r) => r.json())
      .then((data) => {
        if (data.items && Array.isArray(data.items)) {
          setStockItems(data.items);
        }
      })
      .catch(() => {});

    fetch('/api/caja/sesion')
      .then((r) => r.json())
      .then((data) => {
        if (data.session) {
          setCashSession(data.session);
        }
      })
      .catch(() => {});
  }, [demo]);

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

  // Pending settlement modal state
  const [jobForSettlement, setJobForSettlement] = useState<Job | null>(null);
  const [settlementChoice, setSettlementChoice] = useState<'efectivo' | 'transferencia'>('efectivo');

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

  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const q = searchQuery.toLowerCase().trim();
    return jobs.filter((j) =>
      j.plate.toLowerCase().includes(q) ||
      (j.marca && j.marca.toLowerCase().includes(q)) ||
      (j.cliente_nombre && j.cliente_nombre.toLowerCase().includes(q)) ||
      j.service.toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  // Clientes directory aggregation from actual wash jobs
  const clientesList = useMemo(() => {
    const map = new Map<string, {
      key: string;
      nombre: string;
      telefono: string;
      placas: string[];
      totalLavados: number;
      totalGastado: number;
      saldoPendiente: number;
      ultimoLavado: string;
      pendingJobs: Job[];
    }>();

    for (const job of jobs) {
      const cleanPhone = (job.cliente_telefono || '').replace(/\D/g, '');
      const key = cleanPhone || (job.cliente_nombre?.trim() || job.plate).toLowerCase();
      const existing = map.get(key);

      const isPending = job.state === 'entregado' && job.payment_method === 'pendiente';
      const isPaid = job.state === 'entregado' && (job.payment_method === 'efectivo' || job.payment_method === 'transferencia');

      if (!existing) {
        map.set(key, {
          key,
          nombre: job.cliente_nombre?.trim() || 'Cliente frecuente',
          telefono: job.cliente_telefono?.trim() || '',
          placas: [job.plate],
          totalLavados: 1,
          totalGastado: isPaid ? job.amount : 0,
          saldoPendiente: isPending ? job.amount : 0,
          ultimoLavado: job.created_at,
          pendingJobs: isPending ? [job] : [],
        });
      } else {
        if (!existing.placas.includes(job.plate)) {
          existing.placas.push(job.plate);
        }
        existing.totalLavados += 1;
        if (isPaid) existing.totalGastado += job.amount;
        if (isPending) {
          existing.saldoPendiente += job.amount;
          existing.pendingJobs.push(job);
        }
        if (new Date(job.created_at) > new Date(existing.ultimoLavado)) {
          existing.ultimoLavado = job.created_at;
        }
        if (!existing.telefono && job.cliente_telefono) {
          existing.telefono = job.cliente_telefono.trim();
        }
        if (existing.nombre === 'Cliente frecuente' && job.cliente_nombre) {
          existing.nombre = job.cliente_nombre.trim();
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.saldoPendiente - a.saldoPendiente || b.totalLavados - a.totalLavados);
  }, [jobs]);

  const filteredClientes = useMemo(() => {
    if (!searchCliente.trim()) return clientesList;
    const q = searchCliente.toLowerCase().trim();
    return clientesList.filter((c) =>
      c.nombre.toLowerCase().includes(q) ||
      c.telefono.toLowerCase().includes(q) ||
      c.placas.some((p) => p.toLowerCase().includes(q))
    );
  }, [clientesList, searchCliente]);

  async function handleCargarCatalogoSugerido() {
    setBusy(true);
    try {
      if (demo) {
        setStockItems(DEFAULT_STOCK_ITEMS.map((s) => ({ ...s, stock_actual: 0 })));
        setMessage('Catálogo sugerido de 5 insumos cargado con stock inicial en 0 (Modo Demo).');
      } else {
        const res = await fetch('/api/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cargar_catalogo_sugerido' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cargar catálogo sugerido.');
        if (data.items) setStockItems(data.items);
        setMessage(data.message || 'Catálogo sugerido de insumos cargado con éxito.');
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al cargar catálogo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCrearInsumo(e: React.FormEvent) {
    e.preventDefault();
    const nombre = nuevoInsumoNombre.trim();
    if (nombre.length < 2) {
      setMessage('El nombre del insumo debe tener al menos 2 caracteres.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        nombre,
        categoria: nuevoInsumoCategoria,
        unidad: nuevoInsumoUnidad,
        stock_actual: Math.max(0, Number(nuevoInsumoStockAct) || 0),
        stock_minimo: Math.max(0, Number(nuevoInsumoStockMin) || 0),
        costo_unitario: Math.max(0, Number(nuevoInsumoCostoUnit) || 0),
        proveedor: nuevoInsumoProveedor.trim() || undefined,
      };

      if (demo) {
        const newItem: StockItem = {
          id: 'stk-demo-' + Date.now(),
          ...payload,
        };
        setStockItems((prev) => [...prev, newItem]);
        setMessage(`Insumo ${nombre} agregado al catálogo (Modo Demo).`);
      } else {
        const res = await fetch('/api/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear insumo.');
        if (data.item) {
          setStockItems((prev) => [...prev, data.item]);
        }
        setMessage(`Insumo ${nombre} guardado en el catálogo.`);
      }
      setShowNuevoInsumoModal(false);
      setNuevoInsumoNombre('');
      setNuevoInsumoProveedor('');
      setNuevoInsumoStockAct('0');
      setNuevoInsumoCostoUnit('0');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar insumo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAjusteStock(e: React.FormEvent) {
    e.preventDefault();
    if (!ajusteItem) return;
    const nuevoStock = Number(ajusteNuevoStock);
    if (isNaN(nuevoStock) || nuevoStock < 0) {
      setMessage('El stock no puede ser negativo.');
      return;
    }
    setBusy(true);
    try {
      if (demo) {
        setStockItems((prev) =>
          prev.map((it) => (it.id === ajusteItem.id ? { ...it, stock_actual: nuevoStock } : it))
        );
        setMessage(`Stock ajustado manualmente para ${ajusteItem.nombre}: ${nuevoStock} ${ajusteItem.unidad}.`);
      } else {
        const res = await fetch('/api/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ajuste',
            id: ajusteItem.id,
            nuevo_stock: nuevoStock,
            motivo: ajusteMotivo.trim() || 'Ajuste manual de inventario',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al ajustar stock.');
        if (data.item) {
          setStockItems((prev) => prev.map((it) => (it.id === data.item.id ? data.item : it)));
        }
        setMessage(`Stock ajustado para ${ajusteItem.nombre}: ${nuevoStock} ${ajusteItem.unidad}.`);
      }
      setShowAjusteModal(false);
      setAjusteItem(null);
      setAjusteNuevoStock('');
      setAjusteMotivo('');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al ajustar stock.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCompraStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStockItem) return;
    const cant = Number(compraCantidad);
    const cost = Number(compraCosto) || selectedStockItem.costo_unitario;
    if (cant <= 0) {
      setMessage('Ingresá una cantidad mayor a 0.');
      return;
    }
    setBusy(true);
    try {
      const totalGasto = Math.round(cant * cost);
      const idempotencyKey = 'compra_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

      if (demo) {
        setStockItems((prev) =>
          prev.map((item) =>
            item.id === selectedStockItem.id
              ? {
                  ...item,
                  stock_actual: Number(item.stock_actual) + cant,
                  costo_unitario: cost,
                  proveedor: compraProveedor.trim() || item.proveedor,
                }
              : item
          )
        );
        if (compraMedioPago !== 'pendiente' && totalGasto > 0) {
          setExpenses((prev) => [
            {
              id: 'exp-' + Date.now(),
              concepto: `Compra insumo: ${selectedStockItem.nombre} (${cant} ${selectedStockItem.unidad})${compraProveedor ? ` - Prov: ${compraProveedor}` : ''}`,
              monto: totalGasto,
              categoria: 'insumos',
              fecha: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
        setMessage(`Compra registrada en demo: +${cant} ${selectedStockItem.unidad} de ${selectedStockItem.nombre}. ${compraMedioPago === 'pendiente' ? '(A crédito pendiente de pago a proveedor)' : `Gasto imputado: ${formatGs(totalGasto)}`}.`);
      } else {
        const res = await fetch('/api/stock/compras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: selectedStockItem.id,
            cantidad: cant,
            costo_unitario: cost,
            medio_pago: compraMedioPago,
            proveedor: compraProveedor.trim() || undefined,
            notas: compraNotas.trim() || undefined,
            idempotency_key: idempotencyKey,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No pudimos registrar la compra.');
        if (data.item) {
          setStockItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
        }
        if (compraMedioPago === 'pendiente') {
          setMessage(`Compra de insumo registrada a crédito (pendiente de pago a proveedor): ${formatGs(data.costoTotal)}.`);
        } else {
          setMessage(`Compra asentada en stock e imputada en caja (${compraMedioPago}): ${formatGs(data.costoTotal)}.`);
        }
      }
      setShowStockModal(false);
      setSelectedStockItem(null);
      setCompraCantidad('');
      setCompraCosto('');
      setCompraProveedor('');
      setCompraNotas('');
      setCompraMedioPago('efectivo');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al registrar la compra.');
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenSession(e: React.FormEvent) {
    e.preventDefault();
    const fondo = Number(sessionFondoInicial) || 0;
    setBusy(true);
    try {
      if (demo) {
        setCashSession({
          id: 'cs-' + Date.now(),
          opened_by: 'Abel Núñez',
          fondo_inicial: fondo,
          opened_at: new Date().toISOString(),
          status: 'open',
          cashSales: 0,
          cashExpenses: 0,
          expectedCash: fondo,
        });
        setMessage(`Turno de caja iniciado en demo con fondo de ${formatGs(fondo)}.`);
      } else {
        const res = await fetch('/api/caja/sesion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'abrir', fondo_inicial: fondo, notas: sessionNotas }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No pudimos abrir el turno.');
        setCashSession(data.session);
        setMessage(`Turno de caja abierto correctamente.`);
      }
      setShowSessionModal(null);
    } catch (err: any) {
      setMessage(err.message || 'Error al abrir turno.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCloseSession(e: React.FormEvent) {
    e.preventDefault();
    const contado = Number(sessionEfectivoContado);
    if (isNaN(contado) || contado < 0) {
      setMessage('Ingresá el efectivo contado en guaraníes.');
      return;
    }
    setBusy(true);
    try {
      if (demo) {
        const expected = (cashSession?.fondo_inicial || 0) + totalEfectivo - totalGastos;
        const diff = contado - expected;
        setCashSession(null);
        setMessage(
          `Arqueo finalizado: Efectivo contado: ${formatGs(contado)} | Teórico esperado: ${formatGs(expected)} | Diferencia: ${diff >= 0 ? '+' : ''}${formatGs(diff)} (${diff === 0 ? 'Exacto' : diff > 0 ? 'Sobrante' : 'Faltante'}).`
        );
      } else {
        const res = await fetch('/api/caja/sesion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cerrar', efectivo_contado: contado, notas: sessionNotas }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No pudimos cerrar el turno.');
        setCashSession(null);
        setMessage(
          `Arqueo de caja cerrado: Contado ${formatGs(data.resumen.efectivoContado)} | Diferencia ${formatGs(data.resumen.diferencia)}.`
        );
      }
      setShowSessionModal(null);
      setSessionEfectivoContado('');
    } catch (err: any) {
      setMessage(err.message || 'Error al cerrar turno.');
    } finally {
      setBusy(false);
    }
  }

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
          token_publico: 'tk_demo_' + generateJobToken().replace('tk_', ''),
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
        if (paymentChoice === 'pendiente') {
          setMessage(`Vehículo entregado con pago pendiente: ${jobForPayment.plate}. Recordá registrar el cobro al recibir el dinero.`);
        } else {
          setMessage(`Entrega y cobro registrados: ${jobForPayment.plate} (${paymentChoice.toUpperCase()}).`);
        }
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
        if (paymentChoice === 'pendiente') {
          setMessage(`Vehículo entregado con pago pendiente: ${jobForPayment.plate}.`);
        } else {
          setMessage(`Entrega y cobro asentados en la caja: ${jobForPayment.plate} (${paymentChoice.toUpperCase()}).`);
        }
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

  // Confirm settlement of a pending payment
  async function confirmSettlement() {
    if (!jobForSettlement) return;

    if (jobForSettlement.payment_method !== 'pendiente') {
      setMessage('Este vehículo ya tiene su cobro registrado previamente.');
      setJobForSettlement(null);
      return;
    }

    setBusy(true);
    try {
      if (demo) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobForSettlement.id
              ? {
                  ...j,
                  payment_method: settlementChoice,
                }
              : j
          )
        );
        setMessage(
          `Cobro asentado en caja: ${jobForSettlement.plate} (${settlementChoice === 'efectivo' ? 'Efectivo' : 'Transferencia'}). Total ingresado: ${formatGs(jobForSettlement.amount)}.`
        );
      } else {
        const res = await fetch('/api/jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: jobForSettlement.id,
            action: 'cobrar_pendiente',
            payment_method: settlementChoice,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No pudimos registrar el cobro.');
        setJobs((prev) => prev.map((j) => (j.id === data.job.id ? data.job : j)));
        setMessage(
          `Cobro asentado en caja: ${jobForSettlement.plate} (${settlementChoice === 'efectivo' ? 'Efectivo' : 'Transferencia'}). Total ingresado: ${formatGs(jobForSettlement.amount)}.`
        );
      }

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch {}

      setJobForSettlement(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al asentar el cobro.');
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

  // Sanitize CSV cells against spreadsheet formula injection (=, +, -, @)
  function sanitizeCSV(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return '';
    let str = String(val).replace(/;/g, ' ').replace(/[\r\n]+/g, ' ').trim();
    if (str.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(str[0])) {
      str = `'${str}`;
    }
    return str;
  }

  // Export cash register movements to Excel (CSV with UTF-8 BOM & sanitized against formula injection)
  function exportarCajaExcel() {
    const fechaHoy = new Date().toISOString().split('T')[0];

    // UTF-8 BOM so Microsoft Excel opens it seamlessly with accented letters, ñ, and special characters
    let csvContent = '\uFEFF';
    csvContent += `REPORTE DE ARQUEO DE CAJA - LAVAYA!\r\n`;
    csvContent += `Lavadero:;${sanitizeCSV(title)}\r\n`;
    csvContent += `Fecha de exportacion:;${sanitizeCSV(fechaHoy)}\r\n\r\n`;

    // Resumen financiero
    csvContent += `RESUMEN FINANCIERO DEL DIA\r\n`;
    csvContent += `Total Cobrado (Gs.):;${totalCobrado}\r\n`;
    csvContent += `Cobrado en Efectivo (Gs.):;${totalEfectivo}\r\n`;
    csvContent += `Cobrado por Transferencia (Gs.):;${totalTransferencia}\r\n`;
    csvContent += `Cobros Pendientes Vigentes (Gs.):;${totalPendiente}\r\n`;
    csvContent += `Gastos Menores Anotados (Gs.):;${totalGastos}\r\n`;
    csvContent += `Balance Operativo (Gs.):;${balanceOperativo}\r\n\r\n`;

    // Movimientos de Vehículos y Servicios
    csvContent += `VEHICULOS Y SERVICIOS REGISTRADOS (${jobs.length})\r\n`;
    csvContent += `Placa;Tipo;Marca;Servicio;Importe (Gs.);Estado;Medio de Pago;Cliente;Telefono;Fecha Ingreso\r\n`;
    jobs.forEach((j) => {
      const medio =
        j.payment_method === 'efectivo'
          ? 'Efectivo'
          : j.payment_method === 'transferencia'
          ? 'Transferencia'
          : j.payment_method === 'pendiente'
          ? 'Pendiente'
          : 'Sin cobro';
      csvContent += `${sanitizeCSV(j.plate)};${sanitizeCSV(j.tipo)};${sanitizeCSV(j.marca)};${sanitizeCSV(j.service)};${j.amount};${sanitizeCSV(labels[j.state])};${sanitizeCSV(medio)};${sanitizeCSV(j.cliente_nombre)};${sanitizeCSV(j.cliente_telefono)};${sanitizeCSV(j.created_at.substring(0, 16).replace('T', ' '))}\r\n`;
    });
    csvContent += `\r\n`;

    // Movimientos de Gastos
    csvContent += `GASTOS REGISTRADOS (${expenses.length})\r\n`;
    csvContent += `Concepto;Categoria;Monto (Gs.);Fecha\r\n`;
    expenses.forEach((e) => {
      csvContent += `${sanitizeCSV(e.concepto)};${sanitizeCSV(e.categoria)};${e.monto};${sanitizeCSV(e.fecha.substring(0, 16).replace('T', ' '))}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lavaya-arqueo-caja-${fechaHoy}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage('Planilla descargada con éxito para Excel (CSV protegido).');
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
            <>
              <a
                href="/prototipo.html"
                target="_blank"
                rel="noopener noreferrer"
                className="button"
                style={{
                  background: '#154734',
                  borderColor: '#1e5c44',
                  color: '#c6ee38',
                  fontSize: 12,
                  padding: '8px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                <Sparkles size={14} /> Ver Nueva Interfaz (Prototipo HTML) ↗
              </a>
              <button
                className="subtle"
                onClick={() => {
                  setJobs(sampleJobs());
                  setMessage('Demo reiniciada con vehículos de ejemplo.');
                }}
              >
                <RefreshCw size={14} style={{ display: 'inline', marginRight: 5 }} /> Reiniciar demo
              </button>
            </>
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
      <div
        style={{
          display: 'flex',
          gap: 8,
          margin: '22px 0 16px',
          borderBottom: '1px solid var(--line)',
          paddingBottom: 10,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {!isOperator && (
          <button
            onClick={() => setActiveTab('resumen')}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: 0,
              background: activeTab === 'resumen' ? 'var(--ink)' : 'transparent',
              color: activeTab === 'resumen' ? 'white' : 'var(--ink)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📊 Resumen
          </button>
        )}

        <button
          onClick={() => setActiveTab('pista')}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            border: 0,
            background: activeTab === 'pista' ? 'var(--ink)' : 'transparent',
            color: activeTab === 'pista' ? 'white' : 'var(--ink)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          🚘 Lavados ({jobs.filter((j) => j.state !== 'entregado').length})
        </button>

        {!isOperator && (
          <button
            onClick={() => setActiveTab('caja')}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: 0,
              background: activeTab === 'caja' ? 'var(--ink)' : 'transparent',
              color: activeTab === 'caja' ? 'white' : 'var(--ink)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            💰 Caja y Turno
          </button>
        )}

        <button
          onClick={() => setActiveTab('stock')}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            border: 0,
            background: activeTab === 'stock' ? 'var(--ink)' : 'transparent',
            color: activeTab === 'stock' ? 'white' : 'var(--ink)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          📦 Stock {stockItems.filter((s) => Number(s.stock_actual) <= Number(s.stock_minimo)).length > 0 ? `(⚠️ ${stockItems.filter((s) => Number(s.stock_actual) <= Number(s.stock_minimo)).length})` : `(${stockItems.length})`}
        </button>

        <button
          onClick={() => setActiveTab('clientes')}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            border: 0,
            background: activeTab === 'clientes' ? 'var(--ink)' : 'transparent',
            color: activeTab === 'clientes' ? 'white' : 'var(--ink)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          👥 Clientes ({clientesList.length})
        </button>

        {!isOperator && (
          <button
            onClick={() => setActiveTab('servicios')}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              border: 0,
              background: activeTab === 'servicios' ? 'var(--ink)' : 'transparent',
              color: activeTab === 'servicios' ? 'white' : 'var(--ink)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ⚙️ Tarifas ({services.length})
          </button>
        )}
      </div>

      {/* System Notification Message */}
      {message && (
        <p className="notice" role="status" style={{ margin: '12px 0' }}>
          {message}
        </p>
      )}

      {/* TAB 0: RESUMEN EJECUTIVO DEL NEGOCIO */}
      {activeTab === 'resumen' && (
        <div style={{ marginTop: 10 }}>
          {/* Tarjeta de bienvenida y acciones rápidas */}
          <div
            style={{
              background: 'linear-gradient(135deg, #154734 0%, #0d2e21 100%)',
              color: 'white',
              borderRadius: 14,
              padding: '20px 24px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: '0 8px 24px rgba(15, 33, 27, 0.15)',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(198, 238, 56, 0.2)', color: '#c6ee38', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                <Sparkles size={12} /> ESTADO OPERATIVO EN VIVO
              </div>
              <h2 style={{ fontSize: 22, margin: '2px 0 6px', color: 'white' }}>Centro de Control · {title}</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', maxWidth: 540 }}>
                Respondé en segundos: vehículos en proceso, dinero cobrado, insumos por comprar y quién tiene deuda pendiente.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button"
                onClick={() => setShowReceptionModal(true)}
                style={{
                  background: '#c6ee38',
                  color: '#0f2e23',
                  borderColor: '#b2db29',
                  fontWeight: 700,
                  fontSize: 13,
                  gap: 6,
                }}
              >
                <PlusCircle size={16} /> + Recibir vehículo
              </button>
              <button
                type="button"
                onClick={() => setShowSessionModal(cashSession?.status === 'open' ? 'cerrar' : 'abrir')}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: 8,
                  padding: '9px 14px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Wallet size={16} /> {cashSession?.status === 'open' ? 'Cerrar turno' : 'Abrir turno caja'}
              </button>
            </div>
          </div>

          {/* Grid de preguntas ejecutivas clave */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* 1. ¿Qué vehículos tengo y en qué estado están? */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    1. Vehículos en pista
                  </span>
                  <Car size={18} color="#2b7147" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)' }}>
                  {jobs.filter((j) => j.state !== 'entregado').length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {jobs.filter((j) => j.state === 'espera').length} en espera · {jobs.filter((j) => j.state === 'lavando').length} lavando · {jobs.filter((j) => j.state === 'listo').length} listos
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('pista')}
                style={{
                  marginTop: 14,
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid #d4e4cc',
                  background: '#f4f8f0',
                  color: '#2b7147',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Abrir pista de lavado →
              </button>
            </div>

            {/* 2. ¿Quién me debe y cuánto? */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: totalPendiente > 0 ? '4px solid #f59e0b' : '1px solid var(--line)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: totalPendiente > 0 ? '#b45309' : 'var(--muted)', textTransform: 'uppercase' }}>
                    2. Deuda pendiente
                  </span>
                  <Clock size={18} color={totalPendiente > 0 ? '#b45309' : 'var(--muted)'} />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: totalPendiente > 0 ? '#b45309' : '#15803d' }}>
                  {formatGs(totalPendiente)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {pendingJobs.length} {pendingJobs.length === 1 ? 'vehículo entregado sin cobrar' : 'vehículos entregados sin cobrar'}
                </div>
              </div>
              {totalPendiente > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('pista')}
                  style={{
                    marginTop: 14,
                    padding: '7px 12px',
                    borderRadius: 6,
                    border: '1px solid #fde68a',
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Cobrar pendientes ({pendingJobs.length}) 💳
                </button>
              ) : (
                <div style={{ marginTop: 14, fontSize: 11, color: '#15803d', fontWeight: 600 }}>
                  ✓ Sin cuentas por cobrar pendientes
                </div>
              )}
            </div>

            {/* 3. ¿Cuánto cobré y cuánto gasté? */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    3. Cobrado vs Gastado
                  </span>
                  <TrendingUp size={18} color="#2b7147" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#2b7147' }}>
                  {formatGs(totalCobrado)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  💵 {formatGs(totalEfectivo)} efectivo · 📱 {formatGs(totalTransferencia)} transf.
                </div>
                <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>
                  Gastos del día: -{formatGs(totalGastos)}
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #edf1ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Balance operativo:</span>
                <strong style={{ fontSize: 14, color: balanceOperativo >= 0 ? '#15803d' : '#b91c1c' }}>
                  {formatGs(balanceOperativo)}
                </strong>
              </div>
            </div>

            {/* 4. ¿Cuánto efectivo debería tener? */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    4. Efectivo en caja
                  </span>
                  <Banknote size={18} color="#2b7147" />
                </div>
                {cashSession?.status === 'open' ? (
                  <>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#15803d' }}>
                      {formatGs(cashSession.expectedCash ?? (Number(cashSession.fondo_inicial || 0) + totalEfectivo))}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      Fondo inicial: {formatGs(cashSession.fondo_inicial)} · Turno abierto
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--muted)' }}>
                      Turno cerrado
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      Iniciá el turno para controlar arqueo físico y vueltos.
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('caja')}
                style={{
                  marginTop: 14,
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: 'var(--ink)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Control de caja y arqueo →
              </button>
            </div>

            {/* 5. ¿Qué insumos quedan y qué necesito comprar? */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: stockItems.filter(s => Number(s.stock_actual) <= Number(s.stock_minimo)).length > 0 ? '4px solid #ef4444' : '1px solid var(--line)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: stockItems.filter(s => Number(s.stock_actual) <= Number(s.stock_minimo)).length > 0 ? '#b91c1c' : 'var(--muted)', textTransform: 'uppercase' }}>
                    5. Insumos y Stock
                  </span>
                  <Package size={18} color={stockItems.filter(s => Number(s.stock_actual) <= Number(s.stock_minimo)).length > 0 ? '#b91c1c' : '#2b7147'} />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: stockItems.filter(s => Number(s.stock_actual) <= Number(s.stock_minimo)).length > 0 ? '#b91c1c' : '#15803d' }}>
                  {stockItems.filter(s => Number(s.stock_actual) <= Number(s.stock_minimo)).length > 0 ? `${stockItems.filter(s => Number(s.stock_actual) <= Number(s.stock_minimo)).length} bajos` : 'En nivel óptimo'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {stockItems.length} insumos registrados en catálogo
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('stock')}
                style={{
                  marginTop: 14,
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid #d4e4cc',
                  background: '#f4f8f0',
                  color: '#2b7147',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Ver inventario e insumos →
              </button>
            </div>

            {/* 6. Clientes y Fidelización */}
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    6. Clientes Frecuentes
                  </span>
                  <Users size={18} color="#2b7147" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)' }}>
                  {clientesList.length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {deliveredJobs.length} lavados completados · {clientesList.filter(c => c.totalLavados > 1).length} recurrentes
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('clientes')}
                style={{
                  marginTop: 14,
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: 'var(--ink)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Directorio y WhatsApp →
              </button>
            </div>
          </div>

          {/* Vehículos en pista ahora mismo */}
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <strong style={{ fontSize: 16 }}>Vehículos actualmente en el lavadero</strong>
                <small style={{ color: 'var(--muted)', display: 'block', fontSize: 12 }}>
                  Autos y motos en espera, en proceso de lavado o listos para entrega.
                </small>
              </div>
              <button
                type="button"
                className="button small"
                onClick={() => setActiveTab('pista')}
                style={{ fontSize: 12 }}
              >
                Ver tablero completo ↗
              </button>
            </div>

            {jobs.filter((j) => j.state !== 'entregado').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--muted)', fontSize: 13, background: '#fafbf7', borderRadius: 8 }}>
                Pista despejada. No hay vehículos en proceso actualmente.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {jobs.filter((j) => j.state !== 'entregado').slice(0, 6).map((j) => (
                  <div
                    key={j.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#fafbf8',
                      border: '1px solid #edf1ea',
                      borderRadius: 8,
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{j.tipo === 'moto' ? '🏍️' : '🚗'}</span>
                      <div>
                        <strong style={{ fontSize: 14 }}>{j.plate}</strong>
                        {j.marca && <span style={{ fontSize: 12, color: 'var(--muted)' }}> · {j.marca}</span>}
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {j.service} {j.cliente_nombre ? `· ${j.cliente_nombre}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        className="pill"
                        style={{
                          fontSize: 10,
                          background: j.state === 'listo' ? '#d4ef7b' : j.state === 'lavando' ? '#dcfce7' : '#f1f5f9',
                          color: j.state === 'listo' ? '#1f503e' : j.state === 'lavando' ? '#166534' : 'var(--ink)',
                          fontWeight: 700,
                        }}
                      >
                        {labels[j.state]}
                      </span>
                      <strong style={{ fontSize: 13 }}>{formatGs(j.amount)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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

          {/* BANNER DE COBROS PENDIENTES */}
          {pendingJobs.length > 0 && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderLeft: '4px solid #f59e0b',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={20} color="#b45309" />
                <div>
                  <strong style={{ color: '#92400e', fontSize: 13 }}>
                    {pendingJobs.length} {pendingJobs.length === 1 ? 'vehículo entregado pendiente de cobro' : 'vehículos entregados pendientes de cobro'}: {formatGs(totalPendiente)}
                  </strong>
                  <div style={{ fontSize: 11, color: '#78350f', marginTop: 2 }}>
                    Entregados sin asentar dinero en caja. Hacé clic para registrar el cobro:
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {pendingJobs.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      setJobForSettlement(j);
                      setSettlementChoice('efectivo');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #f59e0b',
                      background: '#fff',
                      color: '#92400e',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Wallet size={12} /> {j.plate} · {formatGs(j.amount)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BARRA DE BÚSQUEDA Y RECEPCIÓN RÁPIDA */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '12px 16px',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por chapa, marca o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                  background: '#f9fafb',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontSize: 14,
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {searchQuery && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {filteredJobs.length} {filteredJobs.length === 1 ? 'coincidencia' : 'coincidencias'}
              </span>
            )}

            <button
              type="button"
              className="button"
              onClick={() => setShowReceptionModal(true)}
              style={{ gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700 }}
            >
              <PlusCircle size={16} /> + Recibir vehículo
            </button>
          </div>

          <div className="board-grid">
            {states.map((state) => {
              const stateJobs = filteredJobs.filter((j) => j.state === state);
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
                        <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
                          <div
                            style={{
                              padding: '8px 10px',
                              borderRadius: 6,
                              textAlign: 'center',
                              fontSize: 11,
                              background: job.payment_method === 'pendiente' ? '#fffbeb' : '#edf5eb',
                              border: job.payment_method === 'pendiente' ? '1px solid #fde68a' : '1px solid #d4e4cc',
                              color: job.payment_method === 'pendiente' ? '#92400e' : '#2f603c',
                              fontWeight: 600,
                            }}
                          >
                            {job.payment_method === 'efectivo' && '✓ Entregado · Cobrado en Efectivo 💵'}
                            {job.payment_method === 'transferencia' && '✓ Entregado · Cobrado por Transferencia 📱'}
                            {job.payment_method === 'pendiente' && '⏳ Entregado · Cobro Pendiente'}
                          </div>

                          {job.payment_method === 'pendiente' && (
                            <button
                              disabled={busy}
                              onClick={() => {
                                setJobForSettlement(job);
                                setSettlementChoice('efectivo');
                              }}
                              style={{
                                padding: '9px 12px',
                                fontWeight: 700,
                                borderRadius: 6,
                                border: '1px solid #f59e0b',
                                background: '#fef3c7',
                                color: '#92400e',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                cursor: 'pointer',
                                fontSize: 12,
                              }}
                            >
                              <Wallet size={14} /> Cobrar {formatGs(job.amount)}
                            </button>
                          )}
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '14px 18px',
            }}
          >
            <div>
              <strong style={{ fontSize: 16, color: 'var(--ink)' }}>Arqueo de Caja y Movimientos</strong>
              <small style={{ color: 'var(--muted)', display: 'block', fontSize: 12 }}>
                Control de cobros en efectivo, transferencias bancarias y gastos menores del día.
              </small>
            </div>

            <button
              type="button"
              onClick={exportarCajaExcel}
              className="button small"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                background: '#1e40af',
                borderColor: '#1d4ed8',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={14} /> Exportar Excel (CSV)
            </button>
          </div>

          {/* CONTROL DE TURNO Y ARQUEO FÍSICO */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 12,
              padding: 18,
              marginBottom: 18,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: cashSession?.status === 'open' ? '#16a34a' : '#94a3b8',
                  }}
                />
                <strong style={{ fontSize: 15, color: 'var(--ink)' }}>
                  {cashSession?.status === 'open' ? 'Turno de Caja Activo' : 'Caja Cerrada / Sin Turno Abierto'}
                </strong>
                {cashSession?.status === 'open' && (
                  <span className="pill" style={{ background: '#dcfce7', color: '#15803d', fontSize: 11, padding: '2px 8px' }}>
                    ABIERTA
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                {cashSession?.status === 'open'
                  ? `Iniciada por ${cashSession.opened_by} · Fondo inicial: ${formatGs(cashSession.fondo_inicial)} · Efectivo teórico esperado en mano: ${formatGs((cashSession.fondo_inicial || 0) + totalEfectivo - totalGastos)}.`
                  : 'Abrí un turno indicando el fondo inicial para habilitar el arqueo físico y control de sobrante/faltante.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {cashSession?.status === 'open' ? (
                <button
                  type="button"
                  className="button"
                  onClick={() => setShowSessionModal('cerrar')}
                  style={{ background: '#0f172a', borderColor: '#0f172a', color: 'white', fontSize: 13, gap: 6 }}
                >
                  🔒 Cerrar Turno / Arqueo Físico
                </button>
              ) : (
                <button
                  type="button"
                  className="button"
                  onClick={() => setShowSessionModal('abrir')}
                  style={{ background: '#16a34a', borderColor: '#15803d', color: 'white', fontSize: 13, gap: 6 }}
                >
                  🔓 Abrir Turno de Caja
                </button>
              )}
            </div>
          </div>

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

          {/* SECCIÓN DE COBROS PENDIENTES */}
          <div
            style={{
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 22,
              marginTop: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #edf1ea',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#92400e',
                  }}
                >
                  <Clock size={18} /> Vehículos entregados con cobro pendiente ({pendingJobs.length})
                </h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>
                  Servicios que ya retiró el cliente pero cuyo importe aún no ingresó a la caja. Podés registrarlos en cuanto paguen.
                </p>
              </div>

              <span
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: '#b45309',
                  background: '#fef3c7',
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid #fde68a',
                }}
              >
                {formatGs(totalPendiente)} pendiente
              </span>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {pendingJobs.map((pJob) => (
                <div
                  key={pJob.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#fffdf5',
                    border: '1px solid #fde68a',
                    borderRadius: 8,
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{pJob.tipo === 'moto' ? '🏍️' : '🚗'}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 15, letterSpacing: '0.5px' }}>{pJob.plate}</strong>
                        {pJob.marca && <span style={{ fontSize: 12, color: 'var(--muted)' }}>· {pJob.marca}</span>}
                        <span className="pill" style={{ fontSize: 9, background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                          PENDIENTE DE PAGO
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        {pJob.service}
                        {pJob.cliente_nombre && ` · Cliente: ${pJob.cliente_nombre}`}
                        {pJob.cliente_telefono && ` (${pJob.cliente_telefono})`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <strong style={{ fontSize: 16, color: '#b45309' }}>{formatGs(pJob.amount)}</strong>
                    <button
                      className="button small"
                      disabled={busy}
                      onClick={() => {
                        setJobForSettlement(pJob);
                        setSettlementChoice('efectivo');
                      }}
                      style={{ fontSize: 12, padding: '8px 14px' }}
                    >
                      Registrar cobro 💳
                    </button>
                  </div>
                </div>
              ))}

              {pendingJobs.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '20px 16px',
                    color: '#276b42',
                    background: '#f2f9eb',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  ✓ No hay vehículos con pago pendiente. Todos los servicios entregados están cobrados en caja.
                </div>
              )}
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

      {/* TAB 3: STOCK E INSUMOS */}
      {activeTab === 'stock' && (
        <div style={{ marginTop: 15 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '14px 18px',
            }}
          >
            <div>
              <strong style={{ fontSize: 16, color: 'var(--ink)' }}>Control de Insumos y Stock</strong>
              <small style={{ color: 'var(--muted)', display: 'block', fontSize: 12 }}>
                Monitoreo de químicos, ceras y paños. Las compras registradas en efectivo se descuentan automáticamente de la caja.
              </small>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowNuevoInsumoModal(true)}
                className="subtle"
                style={{ fontSize: 12, padding: '8px 14px' }}
              >
                + Nuevo Insumo
              </button>

              {stockItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStockItem(stockItems[0] || null);
                    setCompraCantidad('5');
                    setCompraCosto(String(stockItems[0]?.costo_unitario || 35000));
                    setShowStockModal(true);
                  }}
                  className="button"
                  style={{ gap: 6, fontSize: 13 }}
                >
                  <Package size={16} /> + Registrar Compra
                </button>
              )}
            </div>
          </div>

          {stockItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                background: 'white',
                borderRadius: 14,
                border: '1px solid var(--line)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <Package size={44} color="#2b7147" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 20, margin: '0 0 6px' }}>Tu inventario está vacío</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 480, margin: '0 auto 24px' }}>
                No tenés insumos dados de alta todavía. Podés crear insumos uno a uno o cargar directamente nuestra plantilla con los 5 productos estándar de lavadero (Champú, Cera, Desengrasante, Silicona y Paños) con stock inicial en 0.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button"
                  disabled={busy}
                  onClick={handleCargarCatalogoSugerido}
                  style={{ gap: 6 }}
                >
                  <Sparkles size={16} /> Cargar catálogo sugerido (Stock inicial en 0)
                </button>
                <button
                  type="button"
                  className="subtle"
                  onClick={() => setShowNuevoInsumoModal(true)}
                  style={{ padding: '9px 16px' }}
                >
                  + Crear insumo manualmente
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
                <div className="stat">
                  <small>Insumos en Catálogo</small>
                  <strong>{stockItems.length}</strong>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    Químicos y accesorios activos
                  </div>
                </div>

                <div className="stat" style={{ borderLeft: stockItems.filter(s => Number(s.stock_actual) <= Number(s.stock_minimo)).length > 0 ? '4px solid #ef4444' : undefined }}>
                  <small style={{ color: stockItems.filter(s => Number(s.stock_actual) <= Number(s.stock_minimo)).length > 0 ? '#b91c1c' : undefined }}>
                    Insumos con Stock Bajo
                  </small>
                  <strong style={{ color: stockItems.filter(s => Number(s.stock_actual) <= Number(s.stock_minimo)).length > 0 ? '#b91c1c' : '#15803d' }}>
                    {stockItems.filter(s => Number(s.stock_actual) <= Number(s.stock_minimo)).length}
                  </strong>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    Requieren compra de reposición
                  </div>
                </div>

                {!isOperator && (
                  <div className="stat">
                    <small>Valorización de Stock</small>
                    <strong style={{ color: '#2d6b49' }}>
                      {formatGs(stockItems.reduce((acc, s) => acc + (Number(s.stock_actual) * Number(s.costo_unitario || 0)), 0))}
                    </strong>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                      Costo total en mercadería
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', fontWeight: 700, fontSize: 14 }}>
                  Catálogo de Químicos y Accesorios
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}>
                        <th style={{ padding: '10px 16px' }}>Insumo</th>
                        <th style={{ padding: '10px 16px' }}>Categoría</th>
                        <th style={{ padding: '10px 16px' }}>Stock Actual</th>
                        <th style={{ padding: '10px 16px' }}>Mínimo</th>
                        {!isOperator && <th style={{ padding: '10px 16px' }}>Costo Unitario</th>}
                        <th style={{ padding: '10px 16px' }}>Proveedor</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockItems.map((item) => {
                        const isLow = Number(item.stock_actual) <= Number(item.stock_minimo);
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                              {item.nombre}
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--muted)', textTransform: 'capitalize' }}>
                              {item.categoria}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  fontWeight: 700,
                                  fontSize: 12,
                                  background: isLow ? '#fee2e2' : '#dcfce7',
                                  color: isLow ? '#991b1b' : '#166534',
                                }}
                              >
                                {item.stock_actual} {item.unidad} {isLow && '⚠️ Bajo'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>
                              {item.stock_minimo} {item.unidad}
                            </td>
                            {!isOperator && (
                              <td style={{ padding: '12px 16px' }}>
                                {formatGs(item.costo_unitario)}
                              </td>
                            )}
                            <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>
                              {item.proveedor || 'No especificado'}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className="subtle"
                                  style={{ padding: '5px 10px', fontSize: 12 }}
                                  onClick={() => {
                                    setAjusteItem(item);
                                    setAjusteNuevoStock(String(item.stock_actual));
                                    setAjusteMotivo('');
                                    setShowAjusteModal(true);
                                  }}
                                >
                                  Ajustar
                                </button>
                                <button
                                  type="button"
                                  className="button small"
                                  style={{ padding: '5px 10px', fontSize: 12 }}
                                  onClick={() => {
                                    setSelectedStockItem(item);
                                    setCompraCantidad('5');
                                    setCompraCosto(String(item.costo_unitario || ''));
                                    setCompraProveedor(item.proveedor || '');
                                    setCompraNotas('');
                                    setShowStockModal(true);
                                  }}
                                >
                                  + Comprar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: CLIENTES Y FIDELIZACIÓN */}
      {activeTab === 'clientes' && (
        <div style={{ marginTop: 15 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '14px 18px',
            }}
          >
            <div>
              <strong style={{ fontSize: 16, color: 'var(--ink)' }}>Directorio de Clientes y Fidelización</strong>
              <small style={{ color: 'var(--muted)', display: 'block', fontSize: 12 }}>
                Historial de vehículos atendidos, contacto por WhatsApp y control de saldos pendientes de pago.
              </small>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por cliente, chapa o teléfono..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  minWidth: 260,
                  background: '#f9fafb',
                }}
              />
            </div>
          </div>

          <div className="stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
            <div className="stat">
              <small>Total Clientes Identificados</small>
              <strong>{clientesList.length}</strong>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                En historial de lavados
              </div>
            </div>

            <div className="stat" style={{ borderLeft: clientesList.filter((c) => c.saldoPendiente > 0).length > 0 ? '4px solid #f59e0b' : undefined }}>
              <small style={{ color: clientesList.filter((c) => c.saldoPendiente > 0).length > 0 ? '#b45309' : undefined }}>
                Clientes con Pago Pendiente
              </small>
              <strong style={{ color: clientesList.filter((c) => c.saldoPendiente > 0).length > 0 ? '#b45309' : '#15803d' }}>
                {clientesList.filter((c) => c.saldoPendiente > 0).length}
              </strong>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {formatGs(clientesList.reduce((acc, c) => acc + c.saldoPendiente, 0))} por cobrar
              </div>
            </div>

            <div className="stat">
              <small>Lavados Totales Realizados</small>
              <strong style={{ color: '#2d6b49' }}>{jobs.length}</strong>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {deliveredJobs.length} ya entregados
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', fontWeight: 700, fontSize: 14 }}>
              Clientes ({filteredClientes.length})
            </div>

            {filteredClientes.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                No encontramos clientes que coincidan con la búsqueda.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '10px 16px' }}>Cliente</th>
                      <th style={{ padding: '10px 16px' }}>Contacto</th>
                      <th style={{ padding: '10px 16px' }}>Vehículos / Chapas</th>
                      <th style={{ padding: '10px 16px' }}>Lavados</th>
                      <th style={{ padding: '10px 16px' }}>Total Invertido</th>
                      <th style={{ padding: '10px 16px' }}>Estado Cobro</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientes.map((c) => {
                      const cleanPhone = c.telefono.replace(/\D/g, '');
                      const waUrl = cleanPhone
                        ? `https://wa.me/595${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(`Hola ${c.nombre}, te escribimos de ${title} para saludarte y coordinar sobre tu vehículo.`)}`
                        : null;

                      return (
                        <tr key={c.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                            {c.nombre}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {c.telefono ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{c.telefono}</span>
                                {waUrl && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      padding: '2px 7px',
                                      borderRadius: 4,
                                      background: '#25d366',
                                      color: 'white',
                                      fontSize: 10,
                                      fontWeight: 700,
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <MessageCircle size={10} /> WhatsApp
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--muted)', fontSize: 11 }}>Sin teléfono anotado</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {c.placas.map((p) => (
                                <span
                                  key={p}
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: '#f1f5f9',
                                    border: '1px solid #e2e8f0',
                                    color: 'var(--ink)',
                                  }}
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {c.totalLavados} {c.totalLavados === 1 ? 'servicio' : 'servicios'}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2b7147' }}>
                            {formatGs(c.totalGastado)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {c.saldoPendiente > 0 ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  fontWeight: 700,
                                  fontSize: 11,
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #fde68a',
                                }}
                              >
                                Debe {formatGs(c.saldoPendiente)}
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  fontWeight: 700,
                                  fontSize: 11,
                                  background: '#dcfce7',
                                  color: '#166534',
                                }}
                              >
                                Al día ✓
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {c.saldoPendiente > 0 && c.pendingJobs.length > 0 && (
                              <button
                                type="button"
                                className="button small"
                                style={{
                                  fontSize: 11,
                                  padding: '4px 8px',
                                  background: '#f59e0b',
                                  borderColor: '#d97706',
                                  color: 'white',
                                  fontWeight: 700,
                                }}
                                onClick={() => {
                                  setJobForSettlement(c.pendingJobs[0]);
                                  setSettlementChoice('efectivo');
                                }}
                              >
                                Cobrar 💳
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SERVICIOS Y TARIFAS */}
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

      {/* MODAL 3: REGISTRAR COBRO PENDIENTE */}
      {jobForSettlement && (
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
            <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>💳 Asentar cobro en caja</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 18px' }}>
              Vehículo entregado: <strong>{jobForSettlement.plate}</strong> · {jobForSettlement.service}
            </p>

            <div style={{ background: '#fef3c7', borderRadius: 10, padding: 16, textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: '#92400e', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Importe a asentar en caja
              </span>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#92400e', marginTop: 4 }}>
                {formatGs(jobForSettlement.amount)}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                ¿Cómo pagó el cliente?:
              </label>

              <div style={{ display: 'grid', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setSettlementChoice('efectivo')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: settlementChoice === 'efectivo' ? '2px solid #2d6b49' : '1px solid var(--line)',
                    background: settlementChoice === 'efectivo' ? '#edf6eb' : '#fff',
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
                    <small style={{ color: 'var(--muted)', fontWeight: 400 }}>Suma directamente a la caja física</small>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSettlementChoice('transferencia')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: settlementChoice === 'transferencia' ? '2px solid #2d6b49' : '1px solid var(--line)',
                    background: settlementChoice === 'transferencia' ? '#edf6eb' : '#fff',
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
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="subtle" onClick={() => setJobForSettlement(null)}>
                Volver
              </button>
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={confirmSettlement}
              >
                Asentar cobro en caja ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REGISTRAR COMPRA DE STOCK */}
      {showStockModal && selectedStockItem && (
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
              maxWidth: 460,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>📦 Registrar Compra de Insumo</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 18px' }}>
              Insumo: <strong>{selectedStockItem.nombre}</strong> (Unidad: {selectedStockItem.unidad})
            </p>

            <form onSubmit={handleCompraStock} style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Cantidad ({selectedStockItem.unidad}) *
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    value={compraCantidad}
                    onChange={(e) => setCompraCantidad(e.target.value)}
                    placeholder="Ej: 5"
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  />
                </label>

                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Costo unitario (₲) *
                  <input
                    type="number"
                    required
                    value={compraCosto}
                    onChange={(e) => setCompraCosto(e.target.value)}
                    placeholder="Ej: 35000"
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Proveedor (opcional)
                  <input
                    type="text"
                    value={compraProveedor}
                    onChange={(e) => setCompraProveedor(e.target.value)}
                    placeholder="Ej: Distribuidora San Blás"
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  />
                </label>

                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Notas / Factura (opcional)
                  <input
                    type="text"
                    value={compraNotas}
                    onChange={(e) => setCompraNotas(e.target.value)}
                    placeholder="Ej: Factura 001-002"
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  />
                </label>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Costo Total de la Compra:</div>
                <strong style={{ fontSize: 20, color: '#b91c1c' }}>
                  {formatGs(Math.round((Number(compraCantidad) || 0) * (Number(compraCosto) || 0)))}
                </strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  Forma de pago de la compra:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setCompraMedioPago('efectivo')}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 8,
                      border: compraMedioPago === 'efectivo' ? '2px solid #2d6b49' : '1px solid var(--line)',
                      background: compraMedioPago === 'efectivo' ? '#edf6eb' : '#fff',
                      fontWeight: 600,
                      fontSize: 11,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    💵 Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompraMedioPago('transferencia')}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 8,
                      border: compraMedioPago === 'transferencia' ? '2px solid #2d6b49' : '1px solid var(--line)',
                      background: compraMedioPago === 'transferencia' ? '#edf6eb' : '#fff',
                      fontWeight: 600,
                      fontSize: 11,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    📱 Transf./Banco
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompraMedioPago('pendiente')}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 8,
                      border: compraMedioPago === 'pendiente' ? '2px solid #b45309' : '1px solid var(--line)',
                      background: compraMedioPago === 'pendiente' ? '#fef3c7' : '#fff',
                      fontWeight: 600,
                      fontSize: 11,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    ⏳ A crédito
                  </button>
                </div>
                {compraMedioPago === 'efectivo' && (
                  <small style={{ color: '#b45309', display: 'block', marginTop: 4, fontSize: 11 }}>
                    * Se descontará automáticamente del efectivo de la caja activa.
                  </small>
                )}
                {compraMedioPago === 'pendiente' && (
                  <small style={{ color: '#92400e', display: 'block', marginTop: 4, fontSize: 11 }}>
                    * Compra a crédito: incrementa stock pero NO asienta gasto en caja hasta liquidar al proveedor.
                  </small>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="subtle" onClick={() => setShowStockModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="button" disabled={busy}>
                  Guardar compra e ingresar stock ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4B: AJUSTE MANUAL DE INVENTARIO */}
      {showAjusteModal && ajusteItem && (
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
              maxWidth: 420,
              padding: 28,
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>⚖️ Ajustar Stock de Insumo</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>
              Insumo: <strong>{ajusteItem.nombre}</strong> · Stock actual en sistema: <strong>{ajusteItem.stock_actual} {ajusteItem.unidad}</strong>
            </p>

            <form onSubmit={handleAjusteStock} style={{ display: 'grid', gap: 14 }}>
              <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                Nuevo conteo físico real ({ajusteItem.unidad}) *
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={ajusteNuevoStock}
                  onChange={(e) => setAjusteNuevoStock(e.target.value)}
                  placeholder="Ej: 12"
                  style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                />
              </label>

              <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                Motivo del ajuste
                <input
                  type="text"
                  value={ajusteMotivo}
                  onChange={(e) => setAjusteMotivo(e.target.value)}
                  placeholder="Ej: Recuento físico fin de mes, derrame de bidón..."
                  style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="subtle" onClick={() => setShowAjusteModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="button" disabled={busy}>
                  Actualizar stock ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4C: CREAR NUEVO INSUMO PERSONALIZADO */}
      {showNuevoInsumoModal && (
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
            <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>✨ Nuevo Insumo para el Catálogo</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>
              Registrá un nuevo químico, accesorio o producto de limpieza para controlar su stock.
            </p>

            <form onSubmit={handleCrearInsumo} style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                Nombre del insumo *
                <input
                  type="text"
                  required
                  value={nuevoInsumoNombre}
                  onChange={(e) => setNuevoInsumoNombre(e.target.value)}
                  placeholder="Ej: Desengrasante de Chasis Industrial"
                  style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Categoría
                  <select
                    value={nuevoInsumoCategoria}
                    onChange={(e) => setNuevoInsumoCategoria(e.target.value)}
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  >
                    <option value="quimico">Químico / Líquido</option>
                    <option value="accesorio">Accesorio / Paño</option>
                    <option value="repuesto">Repuesto / Herramienta</option>
                    <option value="limpieza">Limpieza general</option>
                  </select>
                </label>

                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Unidad de medida
                  <select
                    value={nuevoInsumoUnidad}
                    onChange={(e) => setNuevoInsumoUnidad(e.target.value)}
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  >
                    <option value="L">Litros (L)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="unidades">Unidades (u)</option>
                    <option value="kg">Kilos (kg)</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Stock actual inicial
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={nuevoInsumoStockAct}
                    onChange={(e) => setNuevoInsumoStockAct(e.target.value)}
                    placeholder="0"
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  />
                </label>

                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Stock mínimo de alerta
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={nuevoInsumoStockMin}
                    onChange={(e) => setNuevoInsumoStockMin(e.target.value)}
                    placeholder="5"
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Costo unitario (₲)
                  <input
                    type="number"
                    min="0"
                    value={nuevoInsumoCostoUnit}
                    onChange={(e) => setNuevoInsumoCostoUnit(e.target.value)}
                    placeholder="35000"
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  />
                </label>

                <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Proveedor habitual
                  <input
                    type="text"
                    value={nuevoInsumoProveedor}
                    onChange={(e) => setNuevoInsumoProveedor(e.target.value)}
                    placeholder="Ej: Distribuidora Sol"
                    style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="subtle" onClick={() => setShowNuevoInsumoModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="button" disabled={busy}>
                  Guardar insumo ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ABRIR TURNO DE CAJA */}
      {showSessionModal === 'abrir' && (
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
              maxWidth: 400,
              padding: 28,
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>🔓 Abrir Turno de Caja</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>
              Registrá el efectivo inicial disponible para dar vuelto en el lavadero.
            </p>

            <form onSubmit={handleOpenSession} style={{ display: 'grid', gap: 14 }}>
              <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                Fondo inicial en caja (₲)
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  value={sessionFondoInicial}
                  onChange={(e) => setSessionFondoInicial(e.target.value)}
                  placeholder="Ej: 200000"
                  style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                />
              </label>

              <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                Observaciones (opcional)
                <input
                  type="text"
                  value={sessionNotas}
                  onChange={(e) => setSessionNotas(e.target.value)}
                  placeholder="Ej: Turno mañana, billetes chicos..."
                  style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="subtle" onClick={() => setShowSessionModal(null)}>
                  Cancelar
                </button>
                <button type="submit" className="button" disabled={busy}>
                  Iniciar turno ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CERRAR TURNO Y ARQUEO FÍSICO */}
      {showSessionModal === 'cerrar' && (
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
            <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>🔒 Arqueo y Cierre de Turno</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>
              Contá el dinero físico en mano para verificar que coincida con los movimientos del sistema.
            </p>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 16, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>Fondo inicial:</span>
                <strong>{formatGs(cashSession?.fondo_inicial || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>Cobros en efectivo:</span>
                <strong style={{ color: '#15803d' }}>+{formatGs(totalEfectivo)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--muted)' }}>Gastos en efectivo:</span>
                <strong style={{ color: '#b91c1c' }}>-{formatGs(totalGastos)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #cbd5e1', fontWeight: 700, fontSize: 13 }}>
                <span>Efectivo teórico que debe haber:</span>
                <span style={{ color: '#0f172a' }}>
                  {formatGs((cashSession?.fondo_inicial || 0) + totalEfectivo - totalGastos)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCloseSession} style={{ display: 'grid', gap: 14 }}>
              <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                ¿Cuánto efectivo físico contaste en la caja? (₲)
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={sessionEfectivoContado}
                  onChange={(e) => setSessionEfectivoContado(e.target.value)}
                  placeholder="Ingresá el total de billetes y monedas"
                  style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7, fontSize: 15, fontWeight: 700 }}
                />
              </label>

              {sessionEfectivoContado && (
                (() => {
                  const expected = (cashSession?.fondo_inicial || 0) + totalEfectivo - totalGastos;
                  const counted = Number(sessionEfectivoContado) || 0;
                  const diff = counted - expected;
                  const isExact = diff === 0;
                  const isPositive = diff > 0;
                  return (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: isExact ? '#dcfce7' : isPositive ? '#fef3c7' : '#fee2e2',
                        border: isExact ? '1px solid #86efac' : isPositive ? '1px solid #fde68a' : '1px solid #fca5a5',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: isExact ? '#166534' : isPositive ? '#92400e' : '#991b1b' }}>
                        {isExact && '✓ Arqueo Exacto: La caja cuadra perfectamente'}
                        {isPositive && `▲ Sobrante de Caja: +${formatGs(diff)}`}
                        {!isExact && !isPositive && `▼ Faltante de Caja: -${formatGs(Math.abs(diff))}`}
                      </div>
                    </div>
                  );
                })()
              )}

              <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 600 }}>
                Notas de cierre (opcional)
                <input
                  type="text"
                  value={sessionNotas}
                  onChange={(e) => setSessionNotas(e.target.value)}
                  placeholder="Justificación de diferencias si las hubiera..."
                  style={{ padding: 10, border: '1px solid #ccd8c8', borderRadius: 7 }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="subtle" onClick={() => setShowSessionModal(null)}>
                  Volver
                </button>
                <button type="submit" className="button" disabled={busy}>
                  Confirmar y cerrar turno ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
