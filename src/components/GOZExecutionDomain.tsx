import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, TrendingUp, Target, Filter, Clock, CheckCircle,
  ChevronDown, ChevronRight, Calendar, FileText, Link2,
  BarChart3, Activity, Award, AlertOctagon, Package, Truck,
  Layers, Zap, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { GOZResponse, GOZItem, GOZExecutionStatus } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const getStatusBadge = (status: GOZExecutionStatus) => {
  const config: Record<GOZExecutionStatus, { label: string; color: string }> = {
    completed: { label: '✅ Завершен', color: 'bg-green-100 text-green-800' },
    in_progress: { label: '🔄 В исполнении', color: 'bg-blue-100 text-blue-800' },
    at_risk: { label: '⚠️ Риск', color: 'bg-orange-100 text-orange-800' },
    overdue: { label: '🔴 Просрочен', color: 'bg-red-100 text-red-800' },
    planned: { label: '📅 Запланирован', color: 'bg-gray-100 text-gray-800' }
  };
  const cfg = config[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getMilestoneStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    completed: { label: '✅ Завершено', color: 'bg-green-100 text-green-800' },
    in_progress: { label: '🔄 В работе', color: 'bg-blue-100 text-blue-800' },
    pending: { label: '⏳ Ожидает', color: 'bg-gray-100 text-gray-800' },
    overdue: { label: '🔴 Просрочено', color: 'bg-red-100 text-red-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getLinkedObjectBadge = (type: string) => {
  const config: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    expense_contract: { icon: <FileText size={12} />, label: 'Договор', color: 'bg-blue-100 text-blue-800' },
    logistics: { icon: <Truck size={12} />, label: 'Рейс', color: 'bg-orange-100 text-orange-800' },
    warehouse: { icon: <Package size={12} />, label: 'ТМЦ', color: 'bg-purple-100 text-purple-800' }
  };
  const cfg = config[type] || { icon: <FileText size={12} />, label: type, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.icon}{cfg.label}</span>;
};

interface GOZExecutionDomainProps {
  data: GOZResponse;
}

export const GOZExecutionDomain: React.FC<GOZExecutionDomainProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTheme, setFilterTheme] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredItems = useMemo(() => {
    return data.items.filter(item => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (filterTheme !== 'all' && item.theme !== filterTheme) return false;
      if (filterSearch && !item.subject.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !item.igk_code.includes(filterSearch)) return false;
      return true;
    });
  }, [data.items, filterStatus, filterTheme, filterSearch]);

  const executionTrend = [45, 52, 58, 63, 68, 74];

  const gaugeData = [
    { name: 'Выполнено', value: data.summary.avg_execution_percent, color: '#16A34A' },
    { name: 'Осталось', value: 100 - data.summary.avg_execution_percent, color: '#E5E7EB' }
  ];

  const themeBarData = data.themes
    .filter(t => t.igk_count > 0)
    .map(t => ({
      name: t.theme_name,
      сумма: t.total_amount,
      выполнение: t.avg_execution_percent
    }));

  const ganttData = data.items.map(item => {
    const startDate = new Date(item.planned_start_date).getTime();
    const endDate = new Date(item.planned_end_date).getTime();
    const today = new Date().getTime();
    const totalDuration = endDate - startDate;
    const elapsed = Math.max(0, Math.min(totalDuration, today - startDate));
    const progressPercent = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
    const actualProgress = item.execution_percent;
    
    return {
      id: item.id,
      subject: item.subject,
      igk: item.igk_code.slice(-6),
      startDate: item.planned_start_date,
      endDate: item.planned_end_date,
      status: item.status,
      plannedProgress: Math.min(100, progressPercent),
      actualProgress: actualProgress,
      daysRemaining: item.days_remaining
    };
  });

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА (Предложение 5) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Всего ИГК</span>
            <Target className="text-blue-600" size={16} />
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.total_igk}</div>
          <div className="text-xs text-gray-500 mt-1">уникальных ИГК</div>
          <div className="mt-2">
            <Sparkline data={executionTrend} color="#0054A6" />
          </div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.completed_on_time === 0 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Выполнено в срок</span>
            <Award className="text-green-600" size={16} />
          </div>
          <div className={`text-xl font-bold ${data.summary.completed_on_time === 0 ? 'text-yellow-700' : 'text-gray-900'}`}>{data.summary.completed_on_time}</div>
          <div className="text-xs text-gray-500 mt-1">ИГК завершено</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.overdue > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Просрочено / Риск</span>
            <AlertOctagon className="text-red-600" size={16} />
          </div>
          <div className={`text-xl font-bold ${data.summary.overdue > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.overdue}</div>
          <div className="text-xs text-gray-500 mt-1">требуют внимания</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.plan_completion_percent < 80 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">% выполнения плана</span>
            <CheckCircle className="text-green-600" size={16} />
          </div>
          <div className={`text-xl font-bold ${data.summary.plan_completion_percent < 80 ? 'text-red-700' : data.summary.plan_completion_percent < 95 ? 'text-yellow-700' : 'text-gray-900'}`}>
            {data.summary.plan_completion_percent.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">завершено ИГК</div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ (Предложение 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="text-blue-600" size={20} />
            Общий % выполнения ГОЗ
          </h3>
          <div className="h-80 flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={240} height={240}>
                <PieChart>
                  <Pie data={gaugeData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} startAngle={90} endAngle={-270} dataKey="value">
                    {gaugeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-gray-900">{data.summary.avg_execution_percent.toFixed(0)}%</div>
                <div className="text-xs text-gray-500">среднее</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-green-600" size={20} />
            Выполнение по темам
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={themeBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 11}} />
                <YAxis yAxisId="left" tickFormatter={(val) => `${(val/1000000).toFixed(0)}М`} tick={{fontSize: 11}} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{fontSize: 11}} />
                <Tooltip formatter={(value: number, name: string) => name === 'сумма' ? formatCurrency(value) : `${value}%`} />
                <Legend />
                <Bar yAxisId="left" dataKey="сумма" fill="#0054A6" name="Сумма" />
                <Bar yAxisId="right" dataKey="выполнение" fill="#16A34A" name="Выполнение %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="text-purple-600" size={20} />
            Дорожная карта ИГК
          </h3>
          <div className="h-96 overflow-y-auto">
            <div className="space-y-3">
              {ganttData.map((item) => {
                const statusColors: Record<string, string> = {
                  completed: 'bg-green-500', in_progress: 'bg-blue-500', at_risk: 'bg-orange-500', overdue: 'bg-red-500', planned: 'bg-gray-400'
                };
                const color = statusColors[item.status] || 'bg-gray-400';
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-900 truncate">{item.subject}</span>
                      <span className="text-gray-500 font-mono">{item.igk}</span>
                    </div>
                    <div className="relative h-5 bg-gray-100 rounded overflow-hidden">
                      <div className={`absolute h-full ${color} opacity-30`} style={{ width: `${item.plannedProgress}%` }}></div>
                      <div className={`absolute h-full ${color}`} style={{ width: `${item.actualProgress}%` }}></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                        {item.actualProgress.toFixed(0)}%
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{item.startDate}</span>
                      <span className={item.daysRemaining < 0 ? 'text-red-600 font-bold' : item.daysRemaining < 30 ? 'text-orange-600' : 'text-green-600'}>
                        {item.daysRemaining > 0 ? `Осталось: ${item.daysRemaining} дн.` : item.daysRemaining < 0 ? `Просрочено: ${Math.abs(item.daysRemaining)} дн.` : 'Завершено'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500"></span>Завершен</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500"></span>В исполнении</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500"></span>Риск</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span>Просрочен</span>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Тема:</span>
            <select value={filterTheme} onChange={(e) => setFilterTheme(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все темы</option>
              <option value="armor">Бронетехника</option>
              <option value="aviation">Авиация</option>
              <option value="electronics">Электроника</option>
              <option value="medical">Медтехника</option>
              <option value="industrial">Промышленное</option>
              <option value="it">IT-решения</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус:</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все статусы</option>
              <option value="completed">Завершен</option>
              <option value="in_progress">В исполнении</option>
              <option value="at_risk">Риск</option>
              <option value="overdue">Просрочен</option>
              <option value="planned">Запланирован</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поиск:</span>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="ИГК или тема..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <ExportButton data={filteredItems} filename="goz_items" />
        </div>
      </div>

      {/* Таблица сводки по темам - STICKY HEADER (Предложение 2) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Сводка по темам ГОЗ</h3>
          <ExportButton data={data.themes.filter(t => t.igk_count > 0)} filename="goz_themes" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3">Тема</th>
                <th className="px-3 py-3 text-center">Кол-во ИГК</th>
                <th className="px-3 py-3 text-right">Общая сумма</th>
                <th className="px-3 py-3 text-center">Ср. выполнение</th>
                <th className="px-3 py-3 text-center">Просрочено</th>
                <th className="px-3 py-3 text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.themes.filter(t => t.igk_count > 0).map((theme) => (
                <tr key={theme.theme} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-gray-900">{theme.theme_name}</td>
                  <td className="px-3 py-3 text-center">{theme.igk_count}</td>
                  <td className="px-3 py-3 text-right text-xs font-medium">{formatCurrency(theme.total_amount)}</td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${theme.avg_execution_percent >= 80 ? 'bg-green-500' : theme.avg_execution_percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${theme.avg_execution_percent}%`}}></div>
                      </div>
                      <span className="text-xs font-medium">{theme.avg_execution_percent.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {theme.overdue_count > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle size={10} /> {theme.overdue_count}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">0</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">{getStatusBadge(theme.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица реестра ИГК - STICKY HEADER (Предложение 2) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Реестр ИГК (кликните для детализации)</h3>
          <ExportButton data={filteredItems} filename="goz_registry" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">ИГК</th>
                <th className="px-3 py-3">Контракт</th>
                <th className="px-3 py-3">Продукция</th>
                <th className="px-3 py-3 text-center">Срок</th>
                <th className="px-3 py-3 text-center">Дней</th>
                <th className="px-3 py-3 text-right">Сумма</th>
                <th className="px-3 py-3 text-center">% оплаты</th>
                <th className="px-3 py-3 text-center">% выполнения</th>
                <th className="px-3 py-3 text-center">Дог./Рейс/Склад</th>
                <th className="px-3 py-3 text-center">Статус</th>
                <th className="px-3 py-3 text-center">Риски</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${item.status === 'overdue' ? 'bg-red-50/30' : item.status === 'at_risk' ? 'bg-orange-50/30' : ''}`} onClick={() => toggleRow(item.id)}>
                    <td className="px-3 py-3">{expandedRow === item.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="px-3 py-3 font-mono text-xs font-bold">{item.igk_code}</td>
                    <td className="px-3 py-3 font-mono text-xs">{item.contract_number}</td>
                    <td className="px-3 py-3 text-xs text-gray-900 font-medium">{item.subject}</td>
                    <td className="px-3 py-3 text-center text-xs">{item.planned_end_date}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        item.days_remaining < 0 ? 'bg-red-100 text-red-800' :
                        item.days_remaining < 30 ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.days_remaining > 0 ? `${item.days_remaining} дн.` : item.days_remaining < 0 ? `${item.days_remaining} дн.` : '0'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-medium">{formatCurrency(item.total_amount)}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${item.payment_percent >= 80 ? 'bg-green-500' : item.payment_percent >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{width: `${item.payment_percent}%`}}></div>
                        </div>
                        <span className="text-xs">{item.payment_percent}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${item.execution_percent >= 80 ? 'bg-green-500' : item.execution_percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${item.execution_percent}%`}}></div>
                        </div>
                        <span className="text-xs font-bold">{item.execution_percent}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-xs">{item.expense_contracts_count}/{item.logistics_count}/{item.warehouse_positions_count}</td>
                    <td className="px-3 py-3 text-center">{getStatusBadge(item.status)}</td>
                    <td className="px-3 py-3 text-center">
                      {item.risks_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle size={10} /> {item.risks_count}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={10} /> 0
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedRow === item.id && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={12} className="px-3 py-6">
                        <GOZDetail item={item} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const GOZDetail: React.FC<{item: GOZItem}> = ({item}) => {
  const [activeTab, setActiveTab] = useState<'passport' | 'linked' | 'timeline'>('passport');
  const [filterLinkedType, setFilterLinkedType] = useState<string>('all');

  const filteredLinkedObjects = useMemo(() => {
    if (filterLinkedType === 'all') return item.linked_objects;
    return item.linked_objects.filter(obj => obj.type === filterLinkedType);
  }, [item.linked_objects, filterLinkedType]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('passport')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'passport' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Паспорт ИГК</button>
        <button onClick={() => setActiveTab('linked')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'linked' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Связанные объекты ({item.linked_objects.length})</button>
        <button onClick={() => setActiveTab('timeline')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'timeline' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Хронология вех ({item.milestones.length})</button>
      </div>

      {activeTab === 'passport' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Реквизиты ИГК</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">ИГК</div>
                <div className="font-mono font-bold">{item.igk_code}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Контракт</div>
                <div className="font-medium">{item.contract_number}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Тема</div>
                <div className="font-medium">{item.theme_name}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Продукция</div>
                <div className="font-medium">{item.subject}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Заказчик</div>
                <div className="font-medium">{item.customer}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Финансовые показатели</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Сумма контракта</div>
                <div className="font-medium">{formatCurrency(item.total_amount)}</div>
              </div>
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="text-xs text-gray-600">% оплаты</div>
                <div className="text-lg font-bold text-blue-900">{item.payment_percent}%</div>
              </div>
              <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                <div className="text-xs text-gray-600">% выполнения работ</div>
                <div className="text-lg font-bold text-green-900">{item.execution_percent}%</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Сроки</div>
                <div className="text-xs font-medium">{item.planned_start_date} → {item.planned_end_date}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Статус и риски</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Статус исполнения</div>
                <div className="font-medium">{getStatusBadge(item.status)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Дней до конца</div>
                <div className={`font-medium ${item.days_remaining < 0 ? 'text-red-700' : item.days_remaining < 30 ? 'text-orange-700' : 'text-green-700'}`}>
                  {item.days_remaining > 0 ? `${item.days_remaining} дн.` : item.days_remaining < 0 ? `Просрочено на ${Math.abs(item.days_remaining)} дн.` : 'Завершено'}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Связанные объекты</div>
                <div className="text-xs font-medium">
                  <div>📄 Договоров: {item.expense_contracts_count}</div>
                  <div>🚚 Рейсов: {item.logistics_count}</div>
                  <div>📦 Позиций склада: {item.warehouse_positions_count}</div>
                </div>
              </div>
              {item.risks_count > 0 && (
                <div className="p-2 bg-red-50 rounded border border-red-200">
                  <div className="text-xs text-gray-600 mb-1">Риски:</div>
                  <div className="text-xs text-red-900 font-medium">{item.risks_count} активных рисков</div>
                  <div className="text-xs text-red-700 mt-1">→ Перейти во вкладку "Сводные риски"</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'linked' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Связанные объекты ({filteredLinkedObjects.length})</h4>
            <div className="flex gap-2">
              <button onClick={() => setFilterLinkedType('all')} className={`px-3 py-1 rounded text-xs font-medium ${filterLinkedType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Все ({item.linked_objects.length})</button>
              <button onClick={() => setFilterLinkedType('expense_contract')} className={`px-3 py-1 rounded text-xs font-medium ${filterLinkedType === 'expense_contract' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Договоры ({item.linked_objects.filter(o => o.type === 'expense_contract').length})</button>
              <button onClick={() => setFilterLinkedType('logistics')} className={`px-3 py-1 rounded text-xs font-medium ${filterLinkedType === 'logistics' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Рейсы ({item.linked_objects.filter(o => o.type === 'logistics').length})</button>
              <button onClick={() => setFilterLinkedType('warehouse')} className={`px-3 py-1 rounded text-xs font-medium ${filterLinkedType === 'warehouse' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Склад ({item.linked_objects.filter(o => o.type === 'warehouse').length})</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left">Тип</th>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Наименование</th>
                  <th className="px-3 py-2 text-left">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLinkedObjects.map((obj, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{getLinkedObjectBadge(obj.type)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{obj.id}</td>
                    <td className="px-3 py-2 text-xs text-gray-900">{obj.name}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        obj.status === 'completed' || obj.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        obj.status === 'in_progress' || obj.status === 'in_transit' || obj.status === 'normal' ? 'bg-blue-100 text-blue-800' :
                        obj.status === 'delayed' || obj.status === 'overdue' || obj.status === 'deficit' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {obj.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Хронология ключевых вех</h4>
          <div className="space-y-3">
            {item.milestones.map((milestone, idx) => (
              <div key={milestone.id} className={`flex items-start gap-4 p-4 rounded-lg border ${
                milestone.status === 'completed' ? 'border-green-200 bg-green-50/50' : 
                milestone.status === 'in_progress' ? 'border-blue-200 bg-blue-50/50' :
                milestone.status === 'overdue' ? 'border-red-200 bg-red-50/50' :
                'border-gray-200 bg-white'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  milestone.status === 'completed' ? 'bg-green-500 text-white' : 
                  milestone.status === 'in_progress' ? 'bg-blue-500 text-white' :
                  milestone.status === 'overdue' ? 'bg-red-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>{idx + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{milestone.name}</span>
                    {getMilestoneStatusBadge(milestone.status)}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">{milestone.description}</div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-gray-500">План: <span className="font-medium text-gray-900">{milestone.planned_date}</span></span>
                    <span className="text-gray-500">Факт: <span className={`font-medium ${milestone.actual_date ? 'text-gray-900' : 'text-gray-400'}`}>{milestone.actual_date || '—'}</span></span>
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