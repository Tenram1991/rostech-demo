import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, TrendingUp, Package, Filter, Clock, AlertCircle,
  ChevronDown, ChevronRight, FileText, CheckCircle, Download, Map,
  Truck, Train, Plane, Navigation, Shield,
  PieChart as PieIcon, BarChart3, LineChart as LineIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { LogisticsResponse, LogisticsShipment } from '../types';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0054A6', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

interface LogisticsDomainProps {
  data: LogisticsResponse;
}

type MapMode = 'problems' | 'all' | 'inbound' | 'outbound';

interface AggregatedDirection {
  from: string;
  to: string;
  count: number;
  hasDelayed: boolean;
  hasRisk: boolean;
  isOwn: boolean;
  direction: string;
  shipments: LogisticsShipment[];
}

const extractCity = (fullString: string): string => {
  return fullString
    .split(',')[0]
    .replace(/^г\.\s*/i, '')
    .replace(/^АО\s+/i, '')
    .replace(/^ПАО\s+/i, '')
    .replace(/^ООО\s+/i, '')
    .replace(/^АО'\s+/i, '')
    .replace(/'/g, '')
    .trim();
};

const CITY_MAP: Record<string, {x: number, y: number}> = {
  'Новосибирск': {x: 500, y: 300},
  'Москва': {x: 280, y: 280}, 'Санкт-Петербург': {x: 240, y: 200},
  'Екатеринбург': {x: 420, y: 260}, 'Омск': {x: 580, y: 300},
  'Нижний Тагил': {x: 400, y: 240}, 'Комсомольск-на-Амуре': {x: 820, y: 260},
  'Казань': {x: 380, y: 280}, 'Челябинск': {x: 430, y: 280},
  'Самара': {x: 360, y: 300}, 'Курган': {x: 520, y: 290},
  'Тюмень': {x: 540, y: 270}, 'Владивосток': {x: 900, y: 320},
  'Ахтубинск': {x: 320, y: 380}, 'Алабино': {x: 290, y: 290},
  'Кубинка': {x: 285, y: 285}, 'Мулино': {x: 310, y: 270},
  'Уренгой': {x: 520, y: 140}, 'Зеленоград': {x: 295, y: 270},
  'Воронеж': {x: 300, y: 320}, 'Липецк': {x: 310, y: 310},
  'Набережные Челны': {x: 420, y: 270}, 'Верхняя Салда': {x: 440, y: 250},
  'Пермь': {x: 460, y: 240}, 'Волгоград': {x: 330, y: 360},
  'Нижний Новгород': {x: 320, y: 260}, 'Череповец': {x: 280, y: 240},
  'Магнитогорск': {x: 450, y: 300}, 'Красноярск': {x: 700, y: 280}
};

export const LogisticsDomain: React.FC<LogisticsDomainProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterTransport, setFilterTransport] = useState<string>('all');
  const [filterCarrier, setFilterCarrier] = useState<string>('all');
  const [filterContract, setFilterContract] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [mapMode, setMapMode] = useState<MapMode>('problems');
  const [selectedDirection, setSelectedDirection] = useState<AggregatedDirection | null>(null);

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredShipments = useMemo(() => {
    return data.shipments.filter(s => {
      if (filterDirection !== 'all' && s.direction !== filterDirection) return false;
      if (filterTransport !== 'all' && s.transport_type !== filterTransport) return false;
      if (filterCarrier !== 'all' && s.carrier_name !== filterCarrier) return false;
      if (filterContract !== 'all' && s.income_contract_id !== filterContract) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterSearch && !s.shipment_number.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !s.cargo_name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.shipments, filterDirection, filterTransport, filterCarrier, filterContract, filterStatus, filterSearch]);

  const aggregatedDirections = useMemo(() => {
    const groups: Record<string, LogisticsShipment[]> = {};
    filteredShipments.forEach(s => {
      const from = extractCity(s.route_from);
      const to = extractCity(s.route_to);
      const key = `${from}→${to}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    
    return Object.entries(groups).map(([key, shipments]) => {
      const [from, to] = key.split('→');
      const hasDelayed = shipments.some(s => s.status === 'delayed' || s.deviation_days > 0);
      const hasRisk = shipments.some(s => s.risks.length > 0);
      const isOwn = shipments.every(s => s.transport_type.startsWith('own'));
      const direction = shipments[0].direction;
      
      return { from, to, count: shipments.length, hasDelayed, hasRisk, isOwn, direction, shipments };
    }).filter((dir: AggregatedDirection) => {
      if (mapMode === 'problems') return dir.hasDelayed || dir.hasRisk;
      if (mapMode === 'inbound') return dir.direction === 'inbound';
      if (mapMode === 'outbound') return dir.direction === 'outbound';
      return true;
    });
  }, [filteredShipments, mapMode]);

  const getTransportBadge = (type: string) => {
    const config = {
      own_auto: { icon: <Truck size={12} />, label: 'Авто (собств.)', color: 'bg-blue-100 text-blue-800' },
      own_rail: { icon: <Train size={12} />, label: 'ЖД (собств.)', color: 'bg-indigo-100 text-indigo-800' },
      tk_auto: { icon: <Truck size={12} />, label: 'Авто (ТК)', color: 'bg-purple-100 text-purple-800' },
      tk_rail: { icon: <Train size={12} />, label: 'ЖД (ТК)', color: 'bg-pink-100 text-pink-800' },
      tk_air: { icon: <Plane size={12} />, label: 'Авиа (ТК)', color: 'bg-orange-100 text-orange-800' }
    };
    const cfg = config[type as keyof typeof config] || { icon: <Truck size={12} />, label: type, color: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.icon}{cfg.label}</span>;
  };

  const getDirectionBadge = (direction: string) => {
    if (direction === 'inbound') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">↓ Входящая</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">↑ Исходящая</span>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      planned: { label: 'Запланировано', color: 'bg-gray-100 text-gray-800' },
      in_transit: { label: 'В пути', color: 'bg-blue-100 text-blue-800' },
      delivered: { label: 'Доставлено', color: 'bg-green-100 text-green-800' },
      delayed: { label: 'Задержка', color: 'bg-red-100 text-red-800' },
      customs: { label: 'Таможня', color: 'bg-yellow-100 text-yellow-800' }
    };
    const cfg = config[status as keyof typeof config] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
  };

  const getDeviationBadge = (days: number) => {
    if (days < 0) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Досрочно {Math.abs(days)} дн.</span>;
    if (days === 0) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">В срок</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Задержка {days} дн.</span>;
  };

  const getSlaBadge = (sla: number | null, isOwn: boolean) => {
    if (isOwn) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Внутр. KPI</span>;
    if (sla === null) return <span className="text-xs text-gray-500">—</span>;
    const color = sla >= 90 ? 'bg-green-100 text-green-800' : sla >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{sla}%</span>;
  };

  const getRiskCount = (risks: string[]) => {
    if (risks.length === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={10} /> Нет</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertTriangle size={10} /> {risks.length}</span>;
  };

  const transportTypeData = [
    { name: 'Авто (собств.)', value: data.summary.own_auto_count },
    { name: 'ЖД (собств.)', value: data.summary.own_rail_count },
    { name: 'Авто (ТК)', value: data.summary.tk_auto_count },
    { name: 'ЖД (ТК)', value: data.summary.tk_rail_count },
    { name: 'Авиа (ТК)', value: data.summary.tk_air_count }
  ];

  const costComparisonData = [
    { month: 'Янв', own: 450000, tk: 280000 },
    { month: 'Фев', own: 620000, tk: 320000 },
    { month: 'Мар', own: 580000, tk: 410000 },
    { month: 'Апр', own: 720000, tk: 380000 },
    { month: 'Май', own: 690000, tk: 450000 },
    { month: 'Июн', own: 810000, tk: 520000 }
  ];

  const slaTrendData = [
    { month: 'Янв', 'ТрансЛогистик': 92, 'Деловые Линии': 88, 'РТ-Логистика': 95, 'СДЭК': 97 },
    { month: 'Фев', 'ТрансЛогистик': 94, 'Деловые Линии': 90, 'РТ-Логистика': 96, 'СДЭК': 98 },
    { month: 'Мар', 'ТрансЛогистик': 91, 'Деловые Линии': 89, 'РТ-Логистика': 94, 'СДЭК': 96 },
    { month: 'Апр', 'ТрансЛогистик': 93, 'Деловые Линии': 91, 'РТ-Логистика': 95, 'СДЭК': 97 },
    { month: 'Май', 'ТрансЛогистик': 95, 'Деловые Линии': 92, 'РТ-Логистика': 97, 'СДЭК': 98 },
    { month: 'Июн', 'ТрансЛогистик': 94, 'Деловые Линии': 90, 'РТ-Логистика': 96, 'СДЭК': 97 }
  ];

  const uniqueContracts = [...new Set(data.shipments.map(s => s.income_contract_id))];

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА (Предложение 5) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Всего рейсов</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Navigation className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.total_shipments}</div>
          <div className="text-xs text-gray-500 mt-1">↓ {data.summary.inbound_count} / ↑ {data.summary.outbound_count}</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.own_transport_percent < 50 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Собственный транспорт</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Truck className="text-green-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.own_transport_percent < 50 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.own_transport_percent.toFixed(0)}%</div>
          <div className="text-xs text-gray-500 mt-1">от общего числа</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Общие затраты</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><TrendingUp className="text-purple-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.total_cost)}</div>
          <div className="text-xs text-gray-500 mt-1">на логистику</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${Math.abs(data.summary.avg_deviation_days) > 2 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Ср. отклонение</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Clock className="text-orange-500" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.avg_deviation_days > 2 ? 'text-red-700' : data.summary.avg_deviation_days < 0 ? 'text-green-700' : 'text-gray-900'}`}>
            {data.summary.avg_deviation_days > 0 ? '+' : ''}{data.summary.avg_deviation_days.toFixed(1)} дн.
          </div>
          <div className="text-xs text-gray-500 mt-1">от планового срока</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.avg_sla_percent < 90 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">SLA сторонних ТК</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Shield className="text-blue-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.avg_sla_percent < 90 ? 'text-yellow-700' : 'text-gray-900'}`}>{data.summary.avg_sla_percent.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">соблюдение сроков</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.risk_shipments > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Риски срыва</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertTriangle className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.risk_shipments > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.risk_shipments}</div>
          <div className="text-xs text-gray-500 mt-1">проблемных рейсов</div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ (Предложение 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon className="text-blue-600" size={20} />
            Распределение по видам транспорта
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={transportTypeData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                  {transportTypeData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} рейсов`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-green-600" size={20} />
            Сравнение стоимости: собственный vs ТК
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{fontSize: 11}} />
                <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}К`} tick={{fontSize: 11}} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="own" fill="#0054A6" name="Собственный" />
                <Bar dataKey="tk" fill="#9333EA" name="Сторонние ТК" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LineIcon className="text-purple-600" size={20} />
            Динамика SLA сторонних ТК
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slaTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{fontSize: 11}} />
                <YAxis domain={[80, 100]} tickFormatter={(val) => `${val}%`} tick={{fontSize: 11}} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="ТрансЛогистик" stroke="#0054A6" name="ТрансЛогистик" strokeWidth={2} />
                <Line type="monotone" dataKey="Деловые Линии" stroke="#16A34A" name="Деловые Линии" strokeWidth={2} />
                <Line type="monotone" dataKey="РТ-Логистика" stroke="#F59E0B" name="РТ-Логистика" strokeWidth={2} />
                <Line type="monotone" dataKey="СДЭК" stroke="#DC2626" name="СДЭК" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SVG Карта маршрутов */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Map className="text-blue-600" size={20} />
            Карта маршрутов (центр — Новосибирск)
          </h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setMapMode('problems')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${mapMode === 'problems' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>🔴 Только проблемные</button>
            <button onClick={() => setMapMode('all')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${mapMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>📊 Все направления</button>
            <button onClick={() => setMapMode('inbound')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${mapMode === 'inbound' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>🟢 Только входящие</button>
            <button onClick={() => setMapMode('outbound')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${mapMode === 'outbound' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}> Только исходящие</button>
          </div>
        </div>

        {selectedDirection && (
          <div className="mb-4 p-4 bg-blue-50/50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-semibold text-gray-900">
                {selectedDirection.from} → {selectedDirection.to} ({selectedDirection.count} рейсов)
              </h4>
              <button onClick={() => setSelectedDirection(null)} className="text-gray-500 hover:text-gray-700 text-xs">✕ Закрыть</button>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              Статус: <span className={`font-semibold ${selectedDirection.hasDelayed ? 'text-red-700' : selectedDirection.hasRisk ? 'text-yellow-700' : 'text-green-700'}`}>
                {selectedDirection.hasDelayed ? '🔴 Есть просрочки' : selectedDirection.hasRisk ? '🟡 Есть риски' : '🟢 Все в норме'}
              </span>
            </div>
            <div className="space-y-1">
              {selectedDirection.shipments.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${s.status === 'delayed' ? 'bg-red-600' : s.risks.length > 0 ? 'bg-yellow-500' : 'bg-green-600'}`}></span>
                  <span className="font-mono">{s.shipment_number}</span>
                  <span className="text-gray-700">{s.cargo_name}</span>
                  <span className="text-gray-500 ml-auto">{s.planned_departure} → {s.planned_delivery}</span>
                  {s.deviation_days > 0 && <span className="text-red-700 font-semibold">+{s.deviation_days} дн.</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative w-full h-[700px] bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg overflow-hidden">
          <svg viewBox="0 0 1000 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EFF6FF" />
                <stop offset="100%" stopColor="#F9FAFB" />
              </linearGradient>
            </defs>
            <rect width="1000" height="600" fill="url(#bgGradient)" />

            {aggregatedDirections.map((dir, idx) => {
              const from = CITY_MAP[dir.from] || {x: 500, y: 300};
              const to = CITY_MAP[dir.to] || {x: 500, y: 300};
              
              const strokeWidth = Math.min(2 + dir.count * 1.5, 10);
              
              let lineColor = '#16A34A';
              if (dir.hasDelayed) lineColor = '#DC2626';
              else if (dir.hasRisk) lineColor = '#F59E0B';
              if (mapMode === 'all' && !dir.hasDelayed && !dir.hasRisk && dir.count < 3) {
                lineColor = '#9CA3AF';
              }
              
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              const curveOffset = (idx % 5 - 2) * 30;
              const controlX = midX + (idx % 2 === 0 ? 0 : 40);
              const controlY = midY + curveOffset;
              
              const isSelected = selectedDirection?.from === dir.from && selectedDirection?.to === dir.to;
              
              return (
                <g key={`${dir.from}-${dir.to}`} className="cursor-pointer" onClick={() => setSelectedDirection(dir)}>
                  <path
                    d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
                    stroke="transparent"
                    strokeWidth={strokeWidth + 10}
                    fill="none"
                  />
                  <path
                    d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
                    stroke={lineColor}
                    strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
                    strokeDasharray={dir.isOwn ? '0' : '8,4'}
                    opacity={isSelected ? 1 : (mapMode === 'all' && !dir.hasDelayed && !dir.hasRisk && dir.count < 3 ? 0.3 : 0.85)}
                    fill="none"
                    className="transition-all duration-200 hover:opacity-100"
                  />
                  <circle cx={to.x} cy={to.y} r={isSelected ? 8 : 6} fill={lineColor} />
                  <circle cx={from.x} cy={from.y} r={isSelected ? 8 : 6} fill={lineColor} />
                  
                  <title>{`${dir.from} → ${dir.to}: ${dir.count} рейсов${dir.hasDelayed ? ' 🔴 ПРОСРОЧКА' : dir.hasRisk ? ' ⚠️ риски' : ' ✅ норма'}`}</title>
                  
                  <g transform={`translate(${controlX}, ${controlY})`}>
                    <rect x="-18" y="-10" width="36" height="20" rx="10" fill="white" stroke={lineColor} strokeWidth="1.5" opacity="0.95" />
                    <text x="0" y="4" fontSize="11" textAnchor="middle" fill={lineColor} fontWeight="bold">{dir.count}</text>
                  </g>
                  
                  {dir.hasDelayed && (
                    <>
                      <circle cx={to.x} cy={to.y} r="14" fill="none" stroke="#DC2626" strokeWidth="2.5" opacity="0.6">
                        <animate attributeName="r" from="8" to="20" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={from.x} cy={from.y} r="14" fill="none" stroke="#DC2626" strokeWidth="2.5" opacity="0.6">
                        <animate attributeName="r" from="8" to="20" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}
                </g>
              );
            })}

            {Object.entries(CITY_MAP).map(([name, pos]) => {
              const isCenter = name === 'Новосибирск';
              return (
                <g key={name}>
                  <circle cx={pos.x} cy={pos.y} r={isCenter ? 8 : 5} fill={isCenter ? '#DC2626' : '#1E40AF'} />
                  {isCenter && (
                    <circle cx={pos.x} cy={pos.y} r="14" fill="none" stroke="#DC2626" strokeWidth="2" opacity="0.4">
                      <animate attributeName="r" from="10" to="18" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text 
                    x={pos.x} 
                    y={pos.y + (isCenter ? -18 : -12)} 
                    fontSize={isCenter ? "13" : "11"} 
                    textAnchor="middle" 
                    fill={isCenter ? "#DC2626" : "#374151"} 
                    fontWeight={isCenter ? "bold" : "500"}
                    style={{ pointerEvents: 'none' }}
                  >
                    {name}{isCenter ? ' ★' : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3">Легенда:</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <svg width="40" height="10"><line x1="0" y1="5" x2="40" y2="5" stroke="#16A34A" strokeWidth="3" /></svg>
              <span>Входящая (собственная, норма)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="40" height="10"><line x1="0" y1="5" x2="40" y2="5" stroke="#0054A6" strokeWidth="3" strokeDasharray="6,3" /></svg>
              <span>Исходящая (сторонняя ТК)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="40" height="10"><line x1="0" y1="5" x2="40" y2="5" stroke="#DC2626" strokeWidth="4" /></svg>
              <span className="font-semibold text-red-700">Проблемный маршрут (просрочка)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="40" height="10"><line x1="0" y1="5" x2="40" y2="5" stroke="#F59E0B" strokeWidth="3" /></svg>
              <span className="text-yellow-700">Маршрут с рисками</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="40" height="10">
                <circle cx="5" cy="5" r="4" fill="#DC2626" />
                <text x="12" y="9" fontSize="9" fill="#DC2626" fontWeight="bold">★</text>
              </svg>
              <span>Центр производства (Новосибирск)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Направление:</span>
            <select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="inbound">Входящая</option>
              <option value="outbound">Исходящая</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Вид транспорта:</span>
            <select value={filterTransport} onChange={(e) => setFilterTransport(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="own_auto">Авто (собств.)</option>
              <option value="own_rail">ЖД (собств.)</option>
              <option value="tk_auto">Авто (ТК)</option>
              <option value="tk_rail">ЖД (ТК)</option>
              <option value="tk_air">Авиа (ТК)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Перевозчик:</span>
            <select value={filterCarrier} onChange={(e) => setFilterCarrier(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              {data.carriers.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Доходный контракт:</span>
            <select value={filterContract} onChange={(e) => setFilterContract(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              {uniqueContracts.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус:</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="planned">Запланировано</option>
              <option value="in_transit">В пути</option>
              <option value="delivered">Доставлено</option>
              <option value="delayed">Задержка</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поиск:</span>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="№ рейса или груз..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
        </div>
      </div>

      {/* Таблица рейсов - STICKY HEADER (Предложение 2) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Реестр логистических рейсов (кликните для детализации)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">№ рейса</th>
                <th className="px-3 py-3">Доходный / ИГК</th>
                <th className="px-3 py-3">Расходный</th>
                <th className="px-3 py-3">Напр.</th>
                <th className="px-3 py-3">Транспорт</th>
                <th className="px-3 py-3">Перевозчик</th>
                <th className="px-3 py-3">Маршрут</th>
                <th className="px-3 py-3 text-right">Расст.</th>
                <th className="px-3 py-3">Груз</th>
                <th className="px-3 py-3 text-right">Вес/Объем</th>
                <th className="px-3 py-3 text-right">Стоимость</th>
                <th className="px-3 py-3 text-center">% от дог.</th>
                <th className="px-3 py-3 text-center">Отпр. (план/факт)</th>
                <th className="px-3 py-3 text-center">Доставка (план/факт)</th>
                <th className="px-3 py-3 text-center">Отклон.</th>
                <th className="px-3 py-3">Статус</th>
                <th className="px-3 py-3 text-center">SLA</th>
                <th className="px-3 py-3">ТТН</th>
                <th className="px-3 py-3">Ответств.</th>
                <th className="px-3 py-3 text-center">Риски</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredShipments.map((shipment) => {
                const isOwn = shipment.transport_type.startsWith('own');
                return (
                  <React.Fragment key={shipment.id}>
                    <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleRow(shipment.id)}>
                      <td className="px-3 py-3">{expandedRow === shipment.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                      <td className="px-3 py-3 font-mono text-xs">{shipment.shipment_number}</td>
                      <td className="px-3 py-3">
                        <div className="font-mono text-xs text-gray-500">{shipment.income_contract_id}</div>
                        {shipment.igk_code && <div className="text-xs text-gray-600">ИГК: {shipment.igk_code.slice(-6)}</div>}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">{shipment.expense_contract_id || '—'}</td>
                      <td className="px-3 py-3">{getDirectionBadge(shipment.direction)}</td>
                      <td className="px-3 py-3">{getTransportBadge(shipment.transport_type)}</td>
                      <td className="px-3 py-3 text-xs text-gray-700">{shipment.carrier_name}</td>
                      <td className="px-3 py-3 text-xs text-gray-900">
                        <div>{shipment.route_from.split(',')[0]}</div>
                        <div className="text-gray-500">→ {shipment.route_to.split(',')[0]}</div>
                      </td>
                      <td className="px-3 py-3 text-right text-xs">{shipment.distance_km} км</td>
                      <td className="px-3 py-3 text-xs text-gray-900">{shipment.cargo_name}</td>
                      <td className="px-3 py-3 text-right text-xs">{shipment.weight_tons} т / {shipment.volume_m3} м³</td>
                      <td className="px-3 py-3 text-right font-medium text-xs">{formatCurrency(shipment.cost)}</td>
                      <td className="px-3 py-3 text-center text-xs">{shipment.cost_percent.toFixed(1)}%</td>
                      <td className="px-3 py-3 text-center text-xs">
                        <div>{shipment.planned_departure}</div>
                        {shipment.actual_departure && <div className="text-gray-500">{shipment.actual_departure}</div>}
                      </td>
                      <td className="px-3 py-3 text-center text-xs">
                        <div>{shipment.planned_delivery}</div>
                        {shipment.actual_delivery && <div className="text-gray-500">{shipment.actual_delivery}</div>}
                      </td>
                      <td className="px-3 py-3 text-center">{getDeviationBadge(shipment.deviation_days)}</td>
                      <td className="px-3 py-3">{getStatusBadge(shipment.status)}</td>
                      <td className="px-3 py-3 text-center">{getSlaBadge(shipment.sla_percent, isOwn)}</td>
                      <td className="px-3 py-3 font-mono text-xs">{shipment.ttn_number}</td>
                      <td className="px-3 py-3 text-xs text-gray-700">{shipment.responsible_logist}</td>
                      <td className="px-3 py-3 text-center">{getRiskCount(shipment.risks)}</td>
                    </tr>
                    {expandedRow === shipment.id && (
                      <tr className="bg-blue-50/30">
                        <td colSpan={21} className="px-3 py-6">
                          <ShipmentDetail shipment={shipment} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ShipmentDetail: React.FC<{shipment: LogisticsShipment}> = ({shipment}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'finance' | 'tracking'>('details');

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('details')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'details' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Детали рейса</button>
        <button onClick={() => setActiveTab('finance')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'finance' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Финансы</button>
        <button onClick={() => setActiveTab('tracking')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'tracking' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Трекинг</button>
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Информация о грузе</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Наименование</div>
                <div className="font-medium">{shipment.cargo_name}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Вес</div>
                <div className="font-medium">{shipment.weight_tons} тонн</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Объем</div>
                <div className="font-medium">{shipment.volume_m3} м³</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Расстояние</div>
                <div className="font-medium">{shipment.distance_km} км</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Маршрут</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                <div className="text-xs text-gray-600">Откуда</div>
                <div className="font-medium">{shipment.route_from}</div>
              </div>
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="text-xs text-gray-600">Куда</div>
                <div className="font-medium">{shipment.route_to}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">ТТН / CMR</div>
                <div className="font-mono font-medium">{shipment.ttn_number}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Особенности (ГОЗ)</h4>
            {shipment.igk_code ? (
              <div className="space-y-2 text-sm">
                {shipment.special_permit && (
                  <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                    <div className="text-xs text-gray-600">Спецпропуск</div>
                    <div className="font-medium">{shipment.special_permit}</div>
                  </div>
                )}
                {shipment.armed_escort && (
                  <div className="p-2 bg-red-50 rounded border border-red-200">
                    <div className="text-xs text-gray-600">Вооруженное сопровождение</div>
                    <div className="font-medium text-red-900">Требуется</div>
                  </div>
                )}
                {shipment.military_acceptance && (
                  <div className="p-2 bg-orange-50 rounded border border-orange-200">
                    <div className="text-xs text-gray-600">Военная приемка</div>
                    <div className="font-medium text-orange-900">На месте разгрузки</div>
                  </div>
                )}
                {shipment.separate_account && (
                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="text-xs text-gray-600">Отдельный счет</div>
                    <div className="font-mono font-medium">{shipment.separate_account}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded text-sm text-gray-600">Коммерческий договор, спец. требования не применяются</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Стоимость перевозки</h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Стоимость</div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(shipment.cost)}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-xs text-gray-600 mb-1">% от суммы договора</div>
                <div className="text-lg font-bold text-blue-900">{shipment.cost_percent.toFixed(2)}%</div>
                <div className="text-xs text-gray-600 mt-1">от {formatCurrency(shipment.contract_amount)}</div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Стоимость за км</div>
                <div className="text-lg font-bold text-green-900">{formatCurrency(shipment.cost / shipment.distance_km)}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Документы</h4>
            <div className="space-y-2">
              {shipment.documents.length === 0 ? (
                <div className="text-sm text-gray-500">Документы еще не загружены</div>
              ) : (
                shipment.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <FileText className="text-blue-600" size={20} />
                    <span className="text-sm font-medium text-gray-900">{doc}</span>
                    <button className="ml-auto text-xs text-rostech-blue hover:underline flex items-center gap-1">
                      <Download size={12} /> Скачать
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tracking' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">История перемещения (трекинг)</h4>
          <div className="space-y-3">
            {shipment.waypoints.map((waypoint, idx) => (
              <div key={idx} className={`flex items-center gap-4 p-4 rounded-lg border ${
                waypoint.status === 'completed' ? 'border-green-200 bg-green-50/50' : 
                waypoint.status === 'in_progress' ? 'border-blue-200 bg-blue-50/50' : 
                'border-gray-200 bg-white'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  waypoint.status === 'completed' ? 'bg-green-500 text-white' : 
                  waypoint.status === 'in_progress' ? 'bg-blue-500 text-white' : 
                  'bg-gray-300 text-gray-600'
                }`}>{idx + 1}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{waypoint.name}</div>
                  <div className="text-xs text-gray-600">
                    План: {waypoint.planned_time} | Факт: {waypoint.actual_time || '—'}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-3 py-1 rounded ${
                    waypoint.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    waypoint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {waypoint.status === 'completed' ? 'Завершено' : 
                     waypoint.status === 'in_progress' ? 'В процессе' : 'Ожидает'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};