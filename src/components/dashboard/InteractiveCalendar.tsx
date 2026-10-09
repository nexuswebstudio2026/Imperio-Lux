import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Compra, CitaCliente, Cliente, Proveedor } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Store,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Phone,
  MapPin,
  X,
  Filter,
  DollarSign,
  AlertCircle,
  CalendarDays,
  Check,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';

export const InteractiveCalendar: React.FC = () => {
  const {
    compras,
    proveedores,
    clientes,
    citas,
    addCita,
    updateCita,
    deleteCita,
    updateCompraDueDate,
    currentMoneda,
    setActiveTab,
  } = useApp();

  // Navigation: current year and month in view
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    today.toISOString().substring(0, 10)
  );

  // Filter mode
  const [filterType, setFilterType] = useState<'all' | 'compras' | 'citas' | 'urgente'>('all');

  // Modals
  const [showAddCitaModal, setShowAddCitaModal] = useState(false);
  const [editingCita, setEditingCita] = useState<CitaCliente | null>(null);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);

  // New Cita Form State
  const [citaForm, setCitaForm] = useState({
    cliente_id: clientes[0]?.id || 1,
    titulo: '',
    motivo: '',
    fecha: today.toISOString().substring(0, 10),
    hora: '10:00',
    lugar: 'Sala VIP - Joyería Imperio Lux',
    telefono: '',
    notas: '',
  });

  // Edit Compra Due Date State
  const [compraDueDateForm, setCompraDueDateForm] = useState({
    fecha_vencimiento: '',
    estado_pago: 'Pendiente' as 'Pendiente' | 'Pagada' | 'Vencida',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month names
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now.toISOString().substring(0, 10));
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthDate = new Date(year, month - 1, dayNum);
      const dateStr = prevMonthDate.toISOString().substring(0, 10);
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === today.toISOString().substring(0, 10),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === today.toISOString().substring(0, 10),
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDate = new Date(year, month + 1, i);
      const dateStr = nextMonthDate.toISOString().substring(0, 10);
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === today.toISOString().substring(0, 10),
      });
    }

    return days;
  }, [year, month, today]);

  // Map events per date string
  const eventsByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        comprasVencimiento: Compra[];
        citasCliente: CitaCliente[];
      }
    >();

    // 1. Map purchase due dates
    compras.forEach((compra) => {
      if (compra.fecha_vencimiento) {
        const dateKey = compra.fecha_vencimiento.substring(0, 10);
        if (!map.has(dateKey)) {
          map.set(dateKey, { comprasVencimiento: [], citasCliente: [] });
        }
        map.get(dateKey)!.comprasVencimiento.push(compra);
      }
    });

    // 2. Map client appointments
    citas.forEach((cita) => {
      const dateKey = cita.fecha.substring(0, 10);
      if (!map.has(dateKey)) {
        map.set(dateKey, { comprasVencimiento: [], citasCliente: [] });
      }
      map.get(dateKey)!.citasCliente.push(cita);
    });

    return map;
  }, [compras, citas]);

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    const events = eventsByDate.get(selectedDate) || { comprasVencimiento: [], citasCliente: [] };
    let comprasFiltered = events.comprasVencimiento;
    let citasFiltered = events.citasCliente;

    if (filterType === 'compras') {
      citasFiltered = [];
    } else if (filterType === 'citas') {
      comprasFiltered = [];
    } else if (filterType === 'urgente') {
      comprasFiltered = comprasFiltered.filter((c) => c.estado_pago !== 'Pagada');
      citasFiltered = citasFiltered.filter((c) => c.estado === 'Programada');
    }

    return { compras: comprasFiltered, citas: citasFiltered };
  }, [eventsByDate, selectedDate, filterType]);

  // Statistics for the current month
  const monthStats = useMemo(() => {
    let pendingInvoicesCount = 0;
    let pendingInvoicesAmount = 0;
    let overdueInvoicesCount = 0;
    let appointmentsCount = 0;
    let todayEventsCount = 0;

    const todayStr = today.toISOString().substring(0, 10);
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    compras.forEach((c) => {
      if (c.fecha_vencimiento && c.fecha_vencimiento.startsWith(monthPrefix)) {
        if (c.estado_pago !== 'Pagada') {
          pendingInvoicesCount++;
          pendingInvoicesAmount += c.total;
        }
        if (c.estado_pago === 'Vencida' || (c.fecha_vencimiento < todayStr && c.estado_pago !== 'Pagada')) {
          overdueInvoicesCount++;
        }
      }
      if (c.fecha_vencimiento === todayStr && c.estado_pago !== 'Pagada') {
        todayEventsCount++;
      }
    });

    citas.forEach((ct) => {
      if (ct.fecha.startsWith(monthPrefix)) {
        appointmentsCount++;
      }
      if (ct.fecha === todayStr && ct.estado === 'Programada') {
        todayEventsCount++;
      }
    });

    return {
      pendingInvoicesCount,
      pendingInvoicesAmount,
      overdueInvoicesCount,
      appointmentsCount,
      todayEventsCount,
    };
  }, [compras, citas, year, month, today]);

  // Submit handler for adding appointment
  const handleSaveCita = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaForm.titulo.trim()) return;

    const client = clientes.find((c) => c.id === Number(citaForm.cliente_id));

    if (editingCita) {
      updateCita(editingCita.id, {
        cliente_id: Number(citaForm.cliente_id),
        cliente_nombre: client?.razon_social || 'Cliente',
        titulo: citaForm.titulo.trim(),
        motivo: citaForm.motivo.trim(),
        fecha: citaForm.fecha,
        hora: citaForm.hora,
        lugar: citaForm.lugar,
        telefono: citaForm.telefono || client?.telefono || '',
        notas: citaForm.notas,
      });
      setEditingCita(null);
    } else {
      addCita({
        cliente_id: Number(citaForm.cliente_id),
        cliente_nombre: client?.razon_social || 'Cliente',
        titulo: citaForm.titulo.trim(),
        motivo: citaForm.motivo.trim(),
        fecha: citaForm.fecha,
        hora: citaForm.hora,
        estado: 'Programada',
        lugar: citaForm.lugar,
        telefono: citaForm.telefono || client?.telefono || '',
        notas: citaForm.notas,
      });
    }

    setShowAddCitaModal(false);
    setSelectedDate(citaForm.fecha);
    setCitaForm({
      cliente_id: clientes[0]?.id || 1,
      titulo: '',
      motivo: '',
      fecha: today.toISOString().substring(0, 10),
      hora: '10:00',
      lugar: 'Sala VIP - Joyería Imperio Lux',
      telefono: '',
      notas: '',
    });
  };

  const handleOpenEditCita = (cita: CitaCliente) => {
    setEditingCita(cita);
    setCitaForm({
      cliente_id: cita.cliente_id,
      titulo: cita.titulo,
      motivo: cita.motivo || '',
      fecha: cita.fecha,
      hora: cita.hora,
      lugar: cita.lugar || '',
      telefono: cita.telefono || '',
      notas: cita.notas || '',
    });
    setShowAddCitaModal(true);
  };

  const handleOpenEditCompra = (compra: Compra) => {
    setEditingCompra(compra);
    setCompraDueDateForm({
      fecha_vencimiento: compra.fecha_vencimiento || today.toISOString().substring(0, 10),
      estado_pago: compra.estado_pago || 'Pendiente',
    });
  };

  const handleSaveCompraDueDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompra) {
      updateCompraDueDate(
        editingCompra.id,
        compraDueDateForm.fecha_vencimiento,
        compraDueDateForm.estado_pago
      );
      setEditingCompra(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
      {/* Calendar Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Calendario de Vencimientos y Citas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Interactivo
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitorea facturas de compra por pagar y reuniones programadas con clientes
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Filters */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('compras')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'compras'
                  ? 'bg-violet-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-violet-600'
              }`}
            >
              <Store className="w-3 h-3" />
              <span>Compras</span>
            </button>
            <button
              onClick={() => setFilterType('citas')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'citas'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Citas</span>
            </button>
          </div>

          {/* Month Jumpers */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-2 min-w-[110px] text-center font-mono">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoToday}
              className="px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded cursor-pointer transition-colors ml-1 border-l border-slate-200 dark:border-slate-800"
            >
              Hoy
            </button>
          </div>

          {/* Add appointment CTA */}
          <button
            id="btn-add-appointment"
            onClick={() => {
              setEditingCita(null);
              setCitaForm({
                cliente_id: clientes[0]?.id || 1,
                titulo: '',
                motivo: '',
                fecha: selectedDate || today.toISOString().substring(0, 10),
                hora: '10:00',
                lugar: 'Sala VIP - Joyería Imperio Lux',
                telefono: '',
                notas: '',
              });
              setShowAddCitaModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agendar Cita</span>
          </button>
        </div>
      </div>

      {/* Quick Status KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/40 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">
              Vencen este mes
            </span>
            <span className="text-base font-bold text-violet-700 dark:text-violet-400 font-mono">
              {monthStats.pendingInvoicesCount} facturas
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">
              Monto por pagar
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {currentMoneda.simbolo} {monthStats.pendingInvoicesAmount.toLocaleString('es-CO')}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">
              Citas clientes
            </span>
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {monthStats.appointmentsCount} citas
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">
              Atención Hoy
            </span>
            <span
              className={`text-base font-bold font-mono ${
                monthStats.todayEventsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700'
              }`}
            >
              {monthStats.todayEventsCount} eventos hoy
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Calendar Section (Grid Left, Selected Day Events Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        {/* Left Side: Month Grid (7 Columns) */}
        <div className="lg:col-span-8 p-4 sm:p-5">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            {dayLabels.map((d, idx) => (
              <div
                key={d}
                className={`py-1 ${idx === 0 || idx === 6 ? 'text-slate-400 dark:text-slate-500' : ''}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Matrix */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((dayItem) => {
              const events = eventsByDate.get(dayItem.dateStr);
              const hasCompras = events && events.comprasVencimiento.length > 0;
              const hasCitas = events && events.citasCliente.length > 0;
              const isSelected = selectedDate === dayItem.dateStr;

              // Check if any overdue purchase exists on this day
              const hasOverdue =
                hasCompras &&
                events.comprasVencimiento.some(
                  (c) =>
                    c.estado_pago === 'Vencida' ||
                    (c.fecha_vencimiento &&
                      c.fecha_vencimiento <= today.toISOString().substring(0, 10) &&
                      c.estado_pago !== 'Pagada')
                );

              return (
                <div
                  key={dayItem.dateStr}
                  onClick={() => setSelectedDate(dayItem.dateStr)}
                  className={`min-h-[82px] p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/30'
                      : dayItem.isToday
                      ? 'border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : dayItem.isCurrentMonth
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/30 opacity-50'
                  }`}
                >
                  {/* Day header: Number and icons */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${
                        dayItem.isToday
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : isSelected
                          ? 'bg-blue-600 text-white'
                          : dayItem.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayItem.dayNumber}
                    </span>

                    {/* Quick indicator dots */}
                    <div className="flex items-center gap-1">
                      {hasOverdue && (
                        <span
                          className="w-2 h-2 rounded-full bg-red-500 animate-ping"
                          title="Factura de compra vencida o por vencer hoy"
                        />
                      )}
                      {hasCompras && (
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                      )}
                      {hasCitas && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                  </div>

                  {/* Day Events Badges (Mini Preview) */}
                  <div className="space-y-1 mt-1">
                    {/* Purchase dues badge */}
                    {hasCompras && (filterType === 'all' || filterType === 'compras' || filterType === 'urgente') && (
                      <div
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate flex items-center gap-1 ${
                          hasOverdue
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
                        }`}
                        title={`${events.comprasVencimiento.length} factura(s) por vencer`}
                      >
                        <Store className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">
                          {events.comprasVencimiento.length === 1
                            ? `${events.comprasVencimiento[0].numero_comprobante}`
                            : `${events.comprasVencimiento.length} Facturas`}
                        </span>
                      </div>
                    )}

                    {/* Client appointment badge */}
                    {hasCitas && (filterType === 'all' || filterType === 'citas' || filterType === 'urgente') && (
                      <div
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 truncate flex items-center gap-1"
                        title={`${events.citasCliente.length} cita(s) programada(s)`}
                      >
                        <User className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
                        <span className="truncate">
                          {events.citasCliente[0].hora}{' '}
                          {events.citasCliente.length > 1
                            ? `(+${events.citasCliente.length - 1})`
                            : events.citasCliente[0].titulo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
              <span>Vencimiento Factura de Compra</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Cita Programada con Cliente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Alerta / Vencimiento Crítico</span>
            </div>
          </div>
        </div>

        {/* Right Side: Selected Day Agenda & Action Panel */}
        <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between bg-slate-50/30 dark:bg-slate-950/40">
          <div className="space-y-4">
            {/* Header: Selected Date Title */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Agenda del Día Seleccionado
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                  <span>
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {selectedDate === today.toISOString().substring(0, 10) && (
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded text-[10px] font-bold">
                      HOY
                    </span>
                  )}
                </h3>
              </div>
            </div>

            {/* List of Events for the Selected Day */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {selectedDateEvents.compras.length === 0 && selectedDateEvents.citas.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs">No hay vencimientos de facturas ni citas programadas para este día.</p>
                  <button
                    onClick={() => {
                      setCitaForm((prev) => ({ ...prev, fecha: selectedDate }));
                      setShowAddCitaModal(true);
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                  >
                    + Agendar cita para esta fecha
                  </button>
                </div>
              ) : (
                <>
                  {/* Purchase Invoices Section */}
                  {selectedDateEvents.compras.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-violet-900 dark:text-violet-300">
                        <span className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-violet-600" />
                          <span>Vencimiento Facturas de Compra ({selectedDateEvents.compras.length})</span>
                        </span>
                      </div>

                      {selectedDateEvents.compras.map((compra) => {
                        const prov = proveedores.find((p) => p.id === compra.proveedor_id);
                        const isOverdue =
                          compra.estado_pago === 'Vencida' ||
                          (compra.fecha_vencimiento &&
                            compra.fecha_vencimiento < today.toISOString().substring(0, 10) &&
                            compra.estado_pago !== 'Pagada');

                        return (
                          <div
                            key={compra.id}
                            className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                              isOverdue
                                ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                                : compra.estado_pago === 'Pagada'
                                ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70'
                                : 'bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-900/60 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white font-mono text-xs block">
                                  {compra.numero_comprobante}
                                </span>
                                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                                  Proveedor: <strong>{prov?.razon_social || 'Proveedor'}</strong>
                                </span>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  compra.estado_pago === 'Pagada'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isOverdue
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {compra.estado_pago || 'Pendiente'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                              <span className="font-bold text-violet-700 dark:text-violet-400 font-mono">
                                {currentMoneda.simbolo} {compra.total.toLocaleString('es-CO')}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCompra(compra)}
                                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                                >
                                  Editar Vencimiento
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('compras')}
                                  className="text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                                >
                                  Ver Compra
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Client Appointments Section */}
                  {selectedDateEvents.citas.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Citas con Clientes ({selectedDateEvents.citas.length})</span>
                        </span>
                      </div>

                      {selectedDateEvents.citas.map((cita) => {
                        const isCompleted = cita.estado === 'Completada';
                        return (
                          <div
                            key={cita.id}
                            className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                              isCompleted
                                ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70'
                                : 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                                  {cita.titulo}
                                </h4>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                  <User className="w-3 h-3" />
                                  <span>{cita.cliente_nombre}</span>
                                </p>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  isCompleted
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {cita.hora}
                              </span>
                            </div>

                            {cita.motivo && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                                {cita.motivo}
                              </p>
                            )}

                            <div className="flex flex-col gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                              {cita.lugar && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{cita.lugar}</span>
                                </div>
                              )}
                              {cita.telefono && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{cita.telefono}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-1 text-[11px]">
                              <button
                                type="button"
                                onClick={() =>
                                  updateCita(cita.id, {
                                    estado: isCompleted ? 'Programada' : 'Completada',
                                  })
                                }
                                className={`text-[11px] font-bold cursor-pointer flex items-center gap-1 ${
                                  isCompleted
                                    ? 'text-slate-500 hover:text-slate-700'
                                    : 'text-emerald-600 hover:text-emerald-700'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>{isCompleted ? 'Desmarcar' : 'Completar'}</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCita(cita)}
                                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteCita(cita.id)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                  title="Eliminar cita"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bottom Card Helper */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Gestor de Compromisos Comerciales</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              Imperio Lux ERP
            </span>
          </div>
        </div>
      </div>

      {/* Modal: Schedule / Edit Client Appointment */}
      {showAddCitaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{editingCita ? 'Editar Cita con Cliente' : 'Programar Nueva Cita con Cliente'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCitaModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCita} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cliente Destinatario
                </label>
                <select
                  value={citaForm.cliente_id}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const cli = clientes.find((c) => c.id === id);
                    setCitaForm((prev) => ({
                      ...prev,
                      cliente_id: id,
                      telefono: cli?.telefono || prev.telefono,
                    }));
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razon_social} ({c.numero_documento})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título / Concepto de la Cita *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Demostración de Rolex Submariner o Entrega de Anillo"
                  value={citaForm.titulo}
                  onChange={(e) => setCitaForm({ ...citaForm, titulo: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={citaForm.fecha}
                    onChange={(e) => setCitaForm({ ...citaForm, fecha: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hora *
                  </label>
                  <input
                    type="time"
                    required
                    value={citaForm.hora}
                    onChange={(e) => setCitaForm({ ...citaForm, hora: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lugar o Sala
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sala VIP Joyería, Taller Gemológico, Llamada Virtual"
                  value={citaForm.lugar}
                  onChange={(e) => setCitaForm({ ...citaForm, lugar: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo y Notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre las joyas solicitadas, presupuesto, especificaciones..."
                  value={citaForm.motivo}
                  onChange={(e) => setCitaForm({ ...citaForm, motivo: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCitaModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer shadow-xs transition-colors"
                >
                  {editingCita ? 'Guardar Cambios' : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Purchase Invoice Due Date */}
      {editingCompra && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-violet-600" />
                <span>Vencimiento de Factura de Compra</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCompra(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                Comprobante: {editingCompra.numero_comprobante}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Total:{' '}
                <strong className="text-violet-700 dark:text-violet-400 font-mono">
                  {currentMoneda.simbolo} {editingCompra.total.toFixed(2)}
                </strong>
              </p>
            </div>

            <form onSubmit={handleSaveCompraDueDate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  required
                  value={compraDueDateForm.fecha_vencimiento}
                  onChange={(e) =>
                    setCompraDueDateForm({ ...compraDueDateForm, fecha_vencimiento: e.target.value })
                  }
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estado de Pago de la Factura
                </label>
                <select
                  value={compraDueDateForm.estado_pago}
                  onChange={(e) =>
                    setCompraDueDateForm({
                      ...compraDueDateForm,
                      estado_pago: e.target.value as any,
                    })
                  }
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="Pendiente">Pendiente (Por Pagar)</option>
                  <option value="Pagada">Pagada (Cancelada)</option>
                  <option value="Vencida">Vencida (Expirada)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCompra(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-bold cursor-pointer shadow-xs transition-colors"
                >
                  Guardar Vencimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
