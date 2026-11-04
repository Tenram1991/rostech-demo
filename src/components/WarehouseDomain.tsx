import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, TrendingUp, Package, Filter, Clock, AlertCircle,
  ChevronDown, ChevronRight, FileText, CheckCircle, Download,
  BarChart3, PieChart as PieIcon, LineChart as LineChartIcon, Warehouse,
  Layers, Boxes, Shield
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { WarehouseResponse, WarehouseItem } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0054A6', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

// Все badge-функции на уровне модуля (Правило #N)
const getCategoryBadge = (category: string) => {
  const config: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    pki: { icon: <Package size={12} />, label: 'ПКИ', color: 'bg-blue-100 text-blue-800' },
    materials: { icon: <Layers size={12} />, label: 'Материалы', color: 'bg-purple-100 text-purple-800' },
    finished: { icon: <Boxes size={12} />, label: 'Готовая продукция', color: 'bg-green-100 text-green-800' },
    auxiliary: { icon: <Package size={12} />, label: 'Вспомогательные', color: 'bg-orange-100 text-orange-800' }
  };
  const cfg = config[category] || { icon: <Package size={12} />, label: category, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.icon}{cfg.label}</span>;
};

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    normal: { label: '✅ Норма', color: 'bg-green-100 text-green-800' },
    deficit: { label: '🔴 Дефицит', color: 'bg-red-100 text-red-800' },
    surplus: { label: '🟡 Излишек', color: 'bg-yellow-100 text-yellow-800' },
    obsolete: { label: '⚫ Неликвид', color: 'bg-gray-100 text-gray-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getRiskCount = (risks: string[]) => {
  if (risks.length === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={10} /> Нет</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertTriangle size={10} /> {risks.length}</span>;
};

const getStockLevelBadge = (current: number, min: number, max: number) => {
  const percent = max > 0 ? (current / max) * 100 : 0;
  if (current < min) return { color: 'bg-red-500', label: 'Дефицит', percent };
  if (current > max) return { color: 'bg-yellow-500', label: 'Излишек', percent: 100 };
  return { color: 'bg-green-500', label: 'Норма', percent };
};

interface WarehouseDomainProps {
  data: WarehouseResponse;
}

export const WarehouseDomain: React.FC<WarehouseDomainProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredItems = useMemo(() => {
    return data.items.filter(item => {
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (filterWarehouse !== 'all' && item.storage_location !== filterWarehouse) return false;
      if (filterSearch && !item.name.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !item.ens_code.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.items, filterCategory, filterStatus, filterWarehouse, filterSearch]);

  const categoryData = [
    { name: 'ПКИ', value: data.summary.pki_count, amount: data.summary.pki_value },
    { name: 'Материалы', value: data.summary.materials_count, amount: data.summary.materials_value },
    { name: 'Готовая продукция', value: data.summary.finished_count, amount: data.summary.finished_value },
    { name: 'Вспомогательные', value: data.summary.auxiliary_count, amount: data.summary.auxiliary_value }
  ];

  const statusData = [
    { name: 'Норма', value: data.items.filter(i => i.status === 'normal').length },
    { name: 'Дефицит', value: data.summary.deficit_count },
    { name: 'Излишек', value: data.summary.surplus_count },
    { name: 'Неликвид', value: data.summary.obsolete_count }
  ];

  const turnoverTrend = [42, 38, 35, 40, 37, 34];
  const uniqueWarehouses = [...new Set(data.items.map(i => i.storage_location))];

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Всего позиций</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Warehouse className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.total_positions}</div>
          <div className="text-xs text-gray-500 mt-1">ТМЦ на складе</div>
          <div className="mt-2">
            <Sparkline data={turnoverTrend} color="#0054A6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Общая стоимость</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><TrendingUp className="text-purple-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.total_value)}</div>
          <div className="text-xs text-gray-500 mt-1">всех ТМЦ</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Резерв ГОЗ</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Shield className="text-red-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.goz_reserved_percent.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">{formatCurrency(data.summary.goz_reserved_value)}</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.deficit_count > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Дефицит</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertTriangle className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.deficit_count > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.deficit_count}</div>
          <div className="text-xs text-gray-500 mt-1">позиций</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.obsolete_count > 0 ? 'border-gray-200 bg-gray-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Неликвиды</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Clock className="text-gray-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.obsolete_count > 0 ? 'text-gray-700' : 'text-gray-900'}`}>{data.summary.obsolete_count}</div>
          <div className="text-xs text-gray-500 mt-1">позиций</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Ср. оборачиваемость</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><LineChartIcon className="text-green-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.avg_turnover_days.toFixed(0)} дн.</div>
          <div className="text-xs text-gray-500 mt-1">до оборота</div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon className="text-blue-600" size={20} />
            Распределение по категориям
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                  {categoryData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => 
                  name === 'value' ? `${value} позиций` : formatCurrency(value)
                } />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-green-600" size={20} />
            Статусы ТМЦ
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 11}} />
                <YAxis tick={{fontSize: 11}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0054A6" name="Количество" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LineChartIcon className="text-purple-600" size={20} />
            Динамика оборачиваемости (дни)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { month: 'Июл', days: 42 },
                { month: 'Авг', days: 38 },
                { month: 'Сен', days: 35 },
                { month: 'Окт', days: 40 },
                { month: 'Ноя', days: 37 },
                { month: 'Дек', days: 34 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{fontSize: 11}} />
                <YAxis tick={{fontSize: 11}} label={{ value: 'Дни', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                <Tooltip formatter={(value: number) => `${value} дней`} />
                <Legend />
                <Line type="monotone" dataKey="days" stroke="#8B5CF6" name="Оборачиваемость" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Категория:</span>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="pki">ПКИ</option>
              <option value="materials">Материалы</option>
              <option value="finished">Готовая продукция</option>
              <option value="auxiliary">Вспомогательные</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус:</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="normal">Норма</option>
              <option value="deficit">Дефицит</option>
              <option value="surplus">Излишек</option>
              <option value="obsolete">Неликвид</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Склад:</span>
            <select value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все склады</option>
              {uniqueWarehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поиск:</span>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Наименование или ЕНС код..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <ExportButton data={filteredItems} filename="warehouse_items" />
        </div>
      </div>

      {/* Таблица ТМЦ - STICKY HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Реестр ТМЦ (кликните для детализации)</h3>
          <ExportButton data={filteredItems} filename="warehouse_table" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">ЕНС код</th>
                <th className="px-3 py-3">Наименование</th>
                <th className="px-3 py-3">Категория</th>
                <th className="px-3 py-3 text-center">Остаток</th>
                <th className="px-3 py-3 text-center">Резерв ГОЗ</th>
                <th className="px-3 py-3 text-center">Свободно</th>
                <th className="px-3 py-3 text-center">Уровень запаса</th>
                <th className="px-3 py-3 text-right">Стоимость ед.</th>
                <th className="px-3 py-3 text-right">Общая стоимость</th>
                <th className="px-3 py-3 text-center">Оборачив.</th>
                <th className="px-3 py-3">Статус</th>
                <th className="px-3 py-3">Склад</th>
                <th className="px-3 py-3 text-center">Риски</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                const stockLevel = getStockLevelBadge(item.current_stock, item.min_stock, item.max_stock);
                return (
                  <React.Fragment key={item.id}>
                    <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${item.status === 'deficit' ? 'bg-red-50/30' : item.status === 'obsolete' ? 'bg-gray-50/50' : ''}`} onClick={() => toggleRow(item.id)}>
                      <td className="px-3 py-3">{expandedRow === item.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                      <td className="px-3 py-3 font-mono text-xs">{item.ens_code}</td>
                      <td className="px-3 py-3 text-xs text-gray-900 font-medium">{item.name}</td>
                      <td className="px-3 py-3">{getCategoryBadge(item.category)}</td>
                      <td className="px-3 py-3 text-center text-xs">
                        <div className="font-medium">{item.current_stock}</div>
                        <div className="text-gray-500">{item.unit}</div>
                      </td>
                      <td className="px-3 py-3 text-center text-xs">{item.reserved_for_goz}</td>
                      <td className="px-3 py-3 text-center text-xs">{item.free_stock}</td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${stockLevel.color}`} style={{width: `${Math.min(100, stockLevel.percent)}%`}}></div>
                          </div>
                          <span className="text-xs">{stockLevel.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-xs">{formatCurrency(item.unit_cost)}</td>
                      <td className="px-3 py-3 text-right text-xs font-medium">{formatCurrency(item.total_cost)}</td>
                      <td className="px-3 py-3 text-center text-xs">{item.turnover_days} дн.</td>
                      <td className="px-3 py-3">{getStatusBadge(item.status)}</td>
                      <td className="px-3 py-3 text-xs text-gray-700">{item.storage_location}</td>
                      <td className="px-3 py-3 text-center">{getRiskCount(item.risks)}</td>
                    </tr>
                    {expandedRow === item.id && (
                      <tr className="bg-blue-50/30">
                        <td colSpan={14} className="px-3 py-6">
                          <ItemDetail item={item} />
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

const ItemDetail: React.FC<{item: WarehouseItem}> = ({item}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'movements' | 'risks'>('info');

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'info' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Информация о ТМЦ</button>
        <button onClick={() => setActiveTab('movements')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'movements' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Движения ({item.movements.length})</button>
        <button onClick={() => setActiveTab('risks')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'risks' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Риски ({item.risks.length})</button>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Основные данные</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">ЕНС код</div>
                <div className="font-mono font-bold">{item.ens_code}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Наименование</div>
                <div className="font-medium">{item.name}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Категория</div>
                <div className="font-medium">{getCategoryBadge(item.category)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Единица измерения</div>
                <div className="font-medium">{item.unit}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Место хранения</div>
                <div className="font-medium">{item.storage_location}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Остатки</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="text-xs text-gray-600">Текущий остаток</div>
                <div className="text-lg font-bold text-blue-900">{item.current_stock} {item.unit}</div>
              </div>
              <div className="p-2 bg-red-50 rounded border-l-4 border-red-500">
                <div className="text-xs text-gray-600">Резерв ГОЗ</div>
                <div className="font-medium text-red-900">{item.reserved_for_goz} {item.unit}</div>
              </div>
              <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                <div className="text-xs text-gray-600">Свободный остаток</div>
                <div className="font-medium text-green-900">{item.free_stock} {item.unit}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Мин / Макс</div>
                <div className="font-medium">{item.min_stock} / {item.max_stock} {item.unit}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Стоимость и оборачиваемость</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Стоимость единицы</div>
                <div className="font-medium">{formatCurrency(item.unit_cost)}</div>
              </div>
              <div className="p-2 bg-purple-50 rounded border-l-4 border-purple-500">
                <div className="text-xs text-gray-600">Общая стоимость</div>
                <div className="text-lg font-bold text-purple-900">{formatCurrency(item.total_cost)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Оборачиваемость</div>
                <div className="font-medium">{item.turnover_days} дней</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Статус</div>
                <div className="font-medium">{getStatusBadge(item.status)}</div>
              </div>
              {item.igk_code && (
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="text-xs text-gray-600">ИГК</div>
                  <div className="font-mono font-medium text-blue-900">{item.igk_code}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'movements' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">История движений ТМЦ</h4>
          {item.movements.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">Движения не зарегистрированы</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left">Дата</th>
                    <th className="px-3 py-2 text-left">Тип</th>
                    <th className="px-3 py-2 text-left">Количество</th>
                    <th className="px-3 py-2 text-right">Сумма</th>
                    <th className="px-3 py-2 text-left">Документ</th>
                    <th className="px-3 py-2 text-left">Основание</th>
                    <th className="px-3 py-2 text-left">Контрагент</th>
                    <th className="px-3 py-2 text-left">Ответственный</th>
                    <th className="px-3 py-2 text-center">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {item.movements.map((movement, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs">{movement.date}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          movement.type === 'receipt' ? 'bg-green-100 text-green-800' :
                          movement.type === 'issue' ? 'bg-red-100 text-red-800' :
                          movement.type === 'transfer' ? 'bg-blue-100 text-blue-800' :
                          movement.type === 'inventory' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {movement.type === 'receipt' ? 'Приход' :
                           movement.type === 'issue' ? 'Расход' :
                           movement.type === 'transfer' ? 'Перемещение' :
                           movement.type === 'inventory' ? 'Инвентаризация' : 'Списание'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">{movement.quantity} {item.unit}</td>
                      <td className="px-3 py-2 text-right text-xs font-medium">{formatCurrency(movement.amount)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{movement.document_number}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{movement.basis}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{movement.counterparty}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{movement.responsible}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          movement.status === 'completed' ? 'bg-green-100 text-green-800' :
                          movement.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {movement.status === 'completed' ? 'Завершено' :
                           movement.status === 'draft' ? 'Черновик' : 'Отменено'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'risks' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Риски по ТМЦ</h4>
          {item.risks.length === 0 ? (
            <div className="p-4 bg-green-50 rounded border border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-900">
                <CheckCircle size={16} />
                <span>Риски не выявлены</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {item.risks.map((risk, idx) => (
                <div key={idx} className="p-3 bg-red-50 rounded border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-900">{risk}</span>
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