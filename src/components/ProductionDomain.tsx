import React, { useState, useMemo } from 'react';
import { 
  Factory, AlertTriangle, TrendingUp, Clock, Package, 
  ChevronDown, ChevronRight, CheckCircle, Download, 
  BarChart3, PieChart as PieIcon, LineChart as LineChartIcon,
  AlertCircle, Wrench, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { ProductionResponse, ShopUnit, MaterialNeed, DowntimeEvent } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0054A6', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

// Все badge-функции на уровне модуля (Правило #30)
const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    running: { label: '🟢 В работе', color: 'bg-green-100 text-green-800' },
    idle: { label: '🟡 Простой', color: 'bg-yellow-100 text-yellow-800' },
    maintenance: { label: '🔧 Обслуживание', color: 'bg-blue-100 text-blue-800' },
    breakdown: { label: '🔴 Авария', color: 'bg-red-100 text-red-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getPriorityBadge = (priority: string) => {
  const config: Record<string, { label: string; color: string }> = {
    critical: { label: '🔴 Критический', color: 'bg-red-100 text-red-800' },
    high: { label: '🟠 Высокий', color: 'bg-orange-100 text-orange-800' },
    medium: { label: '🟡 Средний', color: 'bg-yellow-100 text-yellow-800' },
    low: { label: '🟢 Низкий', color: 'bg-green-100 text-green-800' }
  };
  const cfg = config[priority] || { label: priority, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getDowntimeReasonBadge = (reason: string) => {
  const config: Record<string, { label: string; color: string }> = {
    no_materials: { label: 'Нет материалов', color: 'bg-red-100 text-red-800' },
    no_tooling: { label: 'Нет оснастки', color: 'bg-orange-100 text-orange-800' },
    breakdown: { label: 'Поломка', color: 'bg-red-100 text-red-800' },
    planned: { label: 'Плановое ТО', color: 'bg-blue-100 text-blue-800' },
    other: { label: 'Прочее', color: 'bg-gray-100 text-gray-800' }
  };
  const cfg = config[reason] || { label: reason, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

interface ProductionDomainProps {
  data: ProductionResponse;
}

export const ProductionDomain: React.FC<ProductionDomainProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterShopStatus, setFilterShopStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredShops = useMemo(() => {
    return data.shops.filter(s => {
      if (filterShopStatus !== 'all' && s.status !== filterShopStatus) return false;
      if (filterSearch && !s.name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.shops, filterShopStatus, filterSearch]);

  const filteredNeeds = useMemo(() => {
    return data.material_needs.filter(n => {
      if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
      if (filterSearch && !n.item_name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.material_needs, filterPriority, filterSearch]);

  const filteredDowntimes = useMemo(() => {
    return data.downtimes.filter(d => {
      if (filterSearch && !d.shop_name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.downtimes, filterSearch]);

  // Данные для графиков
  const shopLoadData = data.shops.map(s => ({
    name: s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name,
    факт: s.load_percent,
    план: s.planned_load
  }));

  const downtimeReasonData = [
    { name: 'Нет материалов', value: data.downtimes.filter(d => d.reason === 'no_materials').length },
    { name: 'Поломка', value: data.downtimes.filter(d => d.reason === 'breakdown').length },
    { name: 'Плановое ТО', value: data.downtimes.filter(d => d.reason === 'planned').length },
    { name: 'Нет оснастки', value: data.downtimes.filter(d => d.reason === 'no_tooling').length }
  ].filter(d => d.value > 0);

  const lossTrend = [1200000, 950000, 2100000, 1800000, 3200000, 8180000]; // Имитация тренда потерь

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА (Правило #33) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Всего участков</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Factory className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.total_shops}</div>
          <div className="text-xs text-gray-500 mt-1">цехов и линий</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">В работе</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><CheckCircle className="text-green-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.running_count}</div>
          <div className="text-xs text-gray-500 mt-1">участков</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.breakdown_count > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Аварийные простои</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertTriangle className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.breakdown_count > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.breakdown_count}</div>
          <div className="text-xs text-gray-500 mt-1">требуют внимания</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Средняя загрузка</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><TrendingUp className="text-purple-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.avg_load_percent.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">от плановой</div>
          <div className="mt-2">
            <Sparkline data={[82, 85, 84, 88, 87, data.summary.avg_load_percent]} color="#8B5CF6" />
          </div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.critical_shortages > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Критический дефицит</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Package className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.critical_shortages > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.critical_shortages}</div>
          <div className="text-xs text-gray-500 mt-1">позиций ТМЦ</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.total_loss_amount > 5000000 ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Потери от простоев</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Clock className="text-orange-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.total_loss_amount > 5000000 ? 'text-orange-700' : 'text-gray-900'}`}>{formatCurrency(data.summary.total_loss_amount)}</div>
          <div className="text-xs text-gray-500 mt-1">за текущий период</div>
          <div className="mt-2">
            <Sparkline data={lossTrend} color="#F97316" />
          </div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ (Правило #33) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            Загрузка производственных участков (%)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopLoadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 11}} angle={-15} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{fontSize: 11}} tickFormatter={(val) => `${val}%`} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
                <Bar dataKey="план" fill="#E5E7EB" name="План" />
                <Bar dataKey="факт" fill="#0054A6" name="Факт" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon className="text-red-600" size={20} />
            Структура простоев по причинам
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={downtimeReasonData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                  {downtimeReasonData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} случаев`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LineChartIcon className="text-orange-600" size={20} />
            Динамика финансовых потерь от простоев (руб.)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: 'Июнь', loss: 1200000 },
                { month: 'Июль', loss: 950000 },
                { month: 'Авг', loss: 2100000 },
                { month: 'Сен', loss: 1800000 },
                { month: 'Окт', loss: 3200000 },
                { month: 'Ноя', loss: 8180000 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{fontSize: 11}} />
                <YAxis tick={{fontSize: 11}} tickFormatter={(val) => `${(val/1000000).toFixed(1)}М`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="loss" stroke="#F97316" fill="#FED7AA" name="Потери" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус участка:</span>
            <select value={filterShopStatus} onChange={(e) => setFilterShopStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="running">В работе</option>
              <option value="idle">Простой</option>
              <option value="maintenance">Обслуживание</option>
              <option value="breakdown">Авария</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Приоритет дефицита:</span>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="critical">Критический</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поиск:</span>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Цех, ТМЦ..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <ExportButton data={[...filteredShops, ...filteredNeeds]} filename="production_data" />
        </div>
      </div>

      {/* Таблица 1: Загрузка цехов - STICKY HEADER (Правило #33) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Factory size={18} className="text-blue-600" />
            Загрузка производственных участков
          </h3>
          <ExportButton data={filteredShops} filename="shops_load" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">Наименование</th>
                <th className="px-3 py-3">Тип</th>
                <th className="px-3 py-3 text-center">Статус</th>
                <th className="px-3 py-3 text-center">Загрузка (%)</th>
                <th className="px-3 py-3 text-center">Эффективность</th>
                <th className="px-3 py-3 text-center">Часы простоя</th>
                <th className="px-3 py-3">Текущий заказ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredShops.map((shop) => (
                <React.Fragment key={shop.id}>
                  <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${shop.status === 'breakdown' ? 'bg-red-50/30' : shop.status === 'idle' ? 'bg-yellow-50/30' : ''}`} onClick={() => toggleRow(shop.id)}>
                    <td className="px-3 py-3">{expandedRow === shop.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">{shop.name}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 capitalize">{shop.type === 'workshop' ? 'Цех' : shop.type === 'line' ? 'Линия' : 'Участок'}</td>
                    <td className="px-3 py-3 text-center">{getStatusBadge(shop.status)}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${shop.load_percent >= 90 ? 'bg-green-500' : shop.load_percent >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${shop.load_percent}%`}}></div>
                        </div>
                        <span className="text-xs font-bold">{shop.load_percent}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-xs">{shop.efficiency}%</td>
                    <td className="px-3 py-3 text-center text-xs">{shop.downtime_hours} ч.</td>
                    <td className="px-3 py-3 text-xs font-mono text-gray-700">{shop.current_order || '—'}</td>
                  </tr>
                  {expandedRow === shop.id && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={8} className="px-3 py-6">
                        <ShopDetail shop={shop} allNeeds={data.material_needs} allDowntimes={data.downtimes} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица 2: Потребность в материалах - STICKY HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Package size={18} className="text-orange-600" />
            Дефицит материалов на производстве
          </h3>
          <ExportButton data={filteredNeeds} filename="material_needs" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3">Цех</th>
                <th className="px-3 py-3">Наименование ТМЦ</th>
                <th className="px-3 py-3">ЕНС код</th>
                <th className="px-3 py-3 text-center">Потребность</th>
                <th className="px-3 py-3 text-center">На складе</th>
                <th className="px-3 py-3 text-center">Дефицит</th>
                <th className="px-3 py-3 text-center">Срок</th>
                <th className="px-3 py-3">Связанный ИГК</th>
                <th className="px-3 py-3 text-center">Приоритет</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredNeeds.map((need) => (
                <tr key={need.id} className={`hover:bg-gray-50 ${need.priority === 'critical' ? 'bg-red-50/20' : ''}`}>
                  <td className="px-3 py-3 text-xs text-gray-700">{need.shop_name}</td>
                  <td className="px-3 py-3 text-xs font-medium text-gray-900">{need.item_name}</td>
                  <td className="px-3 py-3 font-mono text-xs">{need.ens_code}</td>
                  <td className="px-3 py-3 text-center text-xs">{need.quantity_needed}</td>
                  <td className="px-3 py-3 text-center text-xs">{need.quantity_in_stock}</td>
                  <td className="px-3 py-3 text-center text-xs font-bold text-red-700">{need.shortage}</td>
                  <td className="px-3 py-3 text-center text-xs">{need.needed_date}</td>
                  <td className="px-3 py-3 text-xs font-mono text-gray-700">{need.linked_igk.slice(-6)}</td>
                  <td className="px-3 py-3 text-center">{getPriorityBadge(need.priority)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица 3: Журнал простоев - STICKY HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-red-600" />
            Журнал простоев оборудования
          </h3>
          <ExportButton data={filteredDowntimes} filename="downtimes" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3">Цех / Участок</th>
                <th className="px-3 py-3">Начало</th>
                <th className="px-3 py-3 text-center">Длительность</th>
                <th className="px-3 py-3">Причина</th>
                <th className="px-3 py-3">Описание</th>
                <th className="px-3 py-3 text-right">Фин. потери</th>
                <th className="px-3 py-3">Связанный ИГК</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDowntimes.map((dt) => (
                <tr key={dt.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-xs font-medium text-gray-900">{dt.shop_name}</td>
                  <td className="px-3 py-3 text-xs">{dt.start_time}</td>
                  <td className="px-3 py-3 text-center text-xs font-bold">{dt.duration_hours} ч.</td>
                  <td className="px-3 py-3">{getDowntimeReasonBadge(dt.reason)}</td>
                  <td className="px-3 py-3 text-xs text-gray-700">{dt.description}</td>
                  <td className="px-3 py-3 text-right text-xs font-medium text-red-700">{formatCurrency(dt.loss_amount)}</td>
                  <td className="px-3 py-3 text-xs font-mono text-gray-700">{dt.linked_igk ? dt.linked_igk.slice(-6) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ShopDetail: React.FC<{shop: ShopUnit; allNeeds: MaterialNeed[]; allDowntimes: DowntimeEvent[]}> = ({shop, allNeeds, allDowntimes}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'needs' | 'downtimes'>('info');
  
  const shopNeeds = allNeeds.filter(n => n.shop_id === shop.id);
  const shopDowntimes = allDowntimes.filter(d => d.shop_id === shop.id);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'info' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Информация</button>
        <button onClick={() => setActiveTab('needs')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'needs' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Дефицит материалов ({shopNeeds.length})</button>
        <button onClick={() => setActiveTab('downtimes')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'downtimes' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>История простоев ({shopDowntimes.length})</button>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Основные данные</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Наименование</div>
                <div className="font-medium">{shop.name}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Тип</div>
                <div className="font-medium capitalize">{shop.type === 'workshop' ? 'Цех' : shop.type === 'line' ? 'Линия' : 'Участок'}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Статус</div>
                <div className="font-medium">{getStatusBadge(shop.status)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Текущий заказ</div>
                <div className="font-mono font-medium">{shop.current_order || 'Нет активного заказа'}</div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Показатели эффективности</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="text-xs text-gray-600">Текущая загрузка</div>
                <div className="text-lg font-bold text-blue-900">{shop.load_percent}%</div>
                <div className="text-xs text-gray-600">План: {shop.planned_load}%</div>
              </div>
              <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                <div className="text-xs text-gray-600">Эффективность (OEE)</div>
                <div className="text-lg font-bold text-green-900">{shop.efficiency}%</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Продукция</div>
                <div className="text-xs font-medium">{shop.products.join(', ')}</div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Простои</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-red-50 rounded border-l-4 border-red-500">
                <div className="text-xs text-gray-600">Всего часов простоя</div>
                <div className="text-lg font-bold text-red-900">{shop.downtime_hours} ч.</div>
              </div>
              {shop.downtime_reason && (
                <div className="p-2 bg-orange-50 rounded border border-orange-200">
                  <div className="text-xs text-gray-600">Текущая причина</div>
                  <div className="font-medium text-orange-900">{getDowntimeReasonBadge(shop.downtime_reason)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'needs' && (
        <div>
          {shopNeeds.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" /> Дефицит материалов не зафиксирован
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left">ТМЦ</th>
                    <th className="px-3 py-2 text-center">Потребность</th>
                    <th className="px-3 py-2 text-center">На складе</th>
                    <th className="px-3 py-2 text-center">Дефицит</th>
                    <th className="px-3 py-2 text-center">Срок</th>
                    <th className="px-3 py-2 text-center">Приоритет</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shopNeeds.map((need, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="text-xs font-medium">{need.item_name}</div>
                        <div className="text-xs text-gray-500 font-mono">{need.ens_code}</div>
                      </td>
                      <td className="px-3 py-2 text-center text-xs">{need.quantity_needed}</td>
                      <td className="px-3 py-2 text-center text-xs">{need.quantity_in_stock}</td>
                      <td className="px-3 py-2 text-center text-xs font-bold text-red-700">{need.shortage}</td>
                      <td className="px-3 py-2 text-center text-xs">{need.needed_date}</td>
                      <td className="px-3 py-2 text-center">{getPriorityBadge(need.priority)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'downtimes' && (
        <div>
          {shopDowntimes.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" /> Инцидентов не зафиксировано
            </div>
          ) : (
            <div className="space-y-3">
              {shopDowntimes.map((dt, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${dt.reason === 'breakdown' ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${dt.reason === 'breakdown' ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'}`}>
                    {dt.reason === 'breakdown' ? <AlertTriangle size={14} /> : <Wrench size={14} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">{dt.start_time}</span>
                      {getDowntimeReasonBadge(dt.reason)}
                    </div>
                    <div className="text-sm text-gray-900 mb-1">{dt.description}</div>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>Длительность: <span className="font-medium">{dt.duration_hours} ч.</span></span>
                      <span>Потери: <span className="font-medium text-red-700">{formatCurrency(dt.loss_amount)}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};