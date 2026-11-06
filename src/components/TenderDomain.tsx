import React, { useState, useMemo } from 'react';
import { 
  Target, TrendingUp, DollarSign, FileText, AlertTriangle,
  CheckCircle, XCircle, Clock, Award, Search, Users,
  BarChart as BarChartIcon, PieChart as PieIcon, 
  LineChart as LineChartIcon, Telescope, Calendar, ChevronDown, ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { TenderResponse, Tender } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0054A6', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

// Все badge-функции на уровне модуля (Правило #30)
const getStageBadge = (stage: string) => {
  const config: Record<string, { label: string; color: string }> = {
    planning: { label: '📋 Планирование', color: 'bg-gray-100 text-gray-800' },
    market_research: { label: '🔍 Анализ рынка', color: 'bg-blue-100 text-blue-800' },
    rfp_sent: { label: '📤 Заявки отправлены', color: 'bg-indigo-100 text-indigo-800' },
    negotiation: { label: '🤝 Переговоры', color: 'bg-purple-100 text-purple-800' },
    contract_signed: { label: '✅ Контракт подписан', color: 'bg-green-100 text-green-800' },
    cancelled: { label: '❌ Отменён', color: 'bg-red-100 text-red-800' }
  };
  const cfg = config[stage] || { label: stage, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getTenderTypeBadge = (type: string) => {
  const config: Record<string, { label: string; color: string }> = {
    open: { label: 'Открытый', color: 'bg-green-100 text-green-800' },
    closed: { label: 'Закрытый', color: 'bg-blue-100 text-blue-800' },
    single_source: { label: 'Единственный источник', color: 'bg-orange-100 text-orange-800' },
    framework: { label: 'Рамочный', color: 'bg-purple-100 text-purple-800' }
  };
  const cfg = config[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getRiskBadge = (risks: string[]) => {
  if (risks.length === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={10} /> Нет</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertTriangle size={10} /> {risks.length}</span>;
};

interface TenderDomainProps {
  data: TenderResponse;
}

export const TenderDomain: React.FC<TenderDomainProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredTenders = useMemo(() => {
    return data.tenders.filter(t => {
      if (filterStage !== 'all' && t.stage !== filterStage) return false;
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterSearch && !t.title.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !t.number.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.tenders, filterStage, filterType, filterSearch]);

  // Данные для графиков
  const stageData = [
    { name: 'Планирование', value: data.tenders.filter(t => t.stage === 'planning').length },
    { name: 'Анализ рынка', value: data.tenders.filter(t => t.stage === 'market_research').length },
    { name: 'Заявки отправлены', value: data.tenders.filter(t => t.stage === 'rfp_sent').length },
    { name: 'Переговоры', value: data.tenders.filter(t => t.stage === 'negotiation').length },
    { name: 'Контракт подписан', value: data.tenders.filter(t => t.stage === 'contract_signed').length },
    { name: 'Отменён', value: data.tenders.filter(t => t.stage === 'cancelled').length }
  ].filter(d => d.value > 0);

  const typeData = [
    { name: 'Открытые', value: data.tenders.filter(t => t.type === 'open').length },
    { name: 'Закрытые', value: data.tenders.filter(t => t.type === 'closed').length },
    { name: 'Единственный источник', value: data.tenders.filter(t => t.type === 'single_source').length },
    { name: 'Рамочные', value: data.tenders.filter(t => t.type === 'framework').length }
  ].filter(d => d.value > 0);

  const budgetData = data.budget_forecast.by_quarter.map(q => ({
    quarter: q.quarter,
    план: q.planned,
    факт: q.actual
  }));

  const savingsTrend = [0, 0, 0, 0, 0, data.summary.total_savings];

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА (Правило #33) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Активные тендеры</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Search className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.active_tenders}</div>
          <div className="text-xs text-gray-500 mt-1">в работе</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Общая сумма</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><DollarSign className="text-purple-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.total_planned_amount)}</div>
          <div className="text-xs text-gray-500 mt-1">запланировано</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.total_savings > 0 ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Экономия</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><TrendingUp className="text-green-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.total_savings > 0 ? 'text-green-700' : 'text-gray-900'}`}>{formatCurrency(data.summary.total_savings)}</div>
          <div className="text-xs text-gray-500 mt-1">{data.summary.avg_savings_percent.toFixed(1)}% средняя</div>
          <div className="mt-2">
            <Sparkline data={savingsTrend} color="#16A34A" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Завершено</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><CheckCircle className="text-green-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.completed_tenders}</div>
          <div className="text-xs text-gray-500 mt-1">тендеров</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.cancelled_tenders > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Отменено</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><XCircle className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.cancelled_tenders > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.cancelled_tenders}</div>
          <div className="text-xs text-gray-500 mt-1">тендеров</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Прогноз 2027</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Calendar className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.next_year_forecast)}</div>
          <div className="text-xs text-gray-500 mt-1">на следующий год</div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ (Правило #33) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChartIcon className="text-blue-600" size={20} />
            Воронка этапов тендеров
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{fontSize: 11}} />
                <YAxis type="category" dataKey="name" tick={{fontSize: 11}} width={130} />
                <Tooltip formatter={(value: number) => `${value} тендеров`} />
                <Legend />
                <Bar dataKey="value" fill="#0054A6" name="Количество" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon className="text-purple-600" size={20} />
            Распределение по типам закупок
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                  {typeData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} тендеров`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChartIcon className="text-green-600" size={20} />
            Прогноз бюджета на 2027 год (по кварталам)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" tick={{fontSize: 11}} />
                <YAxis tick={{fontSize: 11}} tickFormatter={(val) => `${(val/1000000).toFixed(0)}М`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="план" fill="#0054A6" name="План" />
                <Bar dataKey="факт" fill="#E5E7EB" name="Факт" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LineChartIcon className="text-orange-600" size={20} />
            Динамика цен по ключевым категориям
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.price_trends[0]?.periods.map((p, i) => ({
                period: p.period,
                [data.price_trends[0].category]: p.price,
                [data.price_trends[1]?.category || '']: data.price_trends[1]?.periods[i]?.price || 0,
                [data.price_trends[2]?.category || '']: data.price_trends[2]?.periods[i]?.price || 0
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{fontSize: 11}} />
                <YAxis tick={{fontSize: 11}} tickFormatter={(val) => `${(val/1000).toFixed(0)}К`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                {data.price_trends.map((trend, idx) => (
                  <Line key={idx} type="monotone" dataKey={trend.category} stroke={COLORS[idx % COLORS.length]} name={trend.category} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Этап:</span>
            <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="planning">Планирование</option>
              <option value="market_research">Анализ рынка</option>
              <option value="rfp_sent">Заявки отправлены</option>
              <option value="negotiation">Переговоры</option>
              <option value="contract_signed">Контракт подписан</option>
              <option value="cancelled">Отменён</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Тип:</span>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="open">Открытый</option>
              <option value="closed">Закрытый</option>
              <option value="single_source">Единственный источник</option>
              <option value="framework">Рамочный</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поиск:</span>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Название или номер тендера..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <ExportButton data={filteredTenders} filename="tenders" />
        </div>
      </div>

      {/* Таблица тендеров - STICKY HEADER (Правило #33) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Telescope size={18} className="text-blue-600" />
            Реестр тендеров и закупок
          </h3>
          <ExportButton data={filteredTenders} filename="tenders_registry" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">№ тендера</th>
                <th className="px-3 py-3">Наименование</th>
                <th className="px-3 py-3">Тип</th>
                <th className="px-3 py-3 text-center">Этап</th>
                <th className="px-3 py-3 text-right">План. сумма</th>
                <th className="px-3 py-3 text-right">Итог. сумма</th>
                <th className="px-3 py-3 text-right">Экономия</th>
                <th className="px-3 py-3 text-center">Участники</th>
                <th className="px-3 py-3">Победитель</th>
                <th className="px-3 py-3 text-center">Дедлайн</th>
                <th className="px-3 py-3">Ответств.</th>
                <th className="px-3 py-3 text-center">Риски</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTenders.map((t) => (
                <React.Fragment key={t.id}>
                  <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${t.stage === 'cancelled' ? 'bg-red-50/20' : t.stage === 'contract_signed' ? 'bg-green-50/10' : ''}`} onClick={() => toggleRow(t.id)}>
                    <td className="px-3 py-3">{expandedRow === t.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="px-3 py-3 font-mono text-xs font-bold">{t.number}</td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900 max-w-xs truncate" title={t.title}>{t.title}</td>
                    <td className="px-3 py-3">{getTenderTypeBadge(t.type)}</td>
                    <td className="px-3 py-3 text-center">{getStageBadge(t.stage)}</td>
                    <td className="px-3 py-3 text-right text-xs font-medium">{formatCurrency(t.planned_amount)}</td>
                    <td className="px-3 py-3 text-right text-xs font-medium">{t.final_amount ? formatCurrency(t.final_amount) : '—'}</td>
                    <td className="px-3 py-3 text-right text-xs">
                      {t.savings_amount > 0 ? (
                        <span className="font-bold text-green-700">{formatCurrency(t.savings_amount)} ({t.savings_percent}%)</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-xs flex items-center justify-center gap-1"><Users size={12} /> {t.participants_count}</td>
                    <td className="px-3 py-3 text-xs text-gray-700">{t.winner || '—'}</td>
                    <td className="px-3 py-3 text-center text-xs">{t.deadline}</td>
                    <td className="px-3 py-3 text-xs text-gray-700">{t.responsible}</td>
                    <td className="px-3 py-3 text-center">{getRiskBadge(t.risks)}</td>
                  </tr>
                  {expandedRow === t.id && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={13} className="px-3 py-6">
                        <TenderDetail tender={t} />
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

const TenderDetail: React.FC<{tender: Tender}> = ({tender}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'risks' | 'timeline'>('info');

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'info' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Информация</button>
        <button onClick={() => setActiveTab('risks')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'risks' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Риски ({tender.risks.length})</button>
        <button onClick={() => setActiveTab('timeline')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'timeline' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Хронология</button>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Реквизиты тендера</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Номер</div>
                <div className="font-mono font-bold">{tender.number}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Наименование</div>
                <div className="font-medium">{tender.title}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Тип закупки</div>
                <div className="font-medium">{getTenderTypeBadge(tender.type)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Текущий этап</div>
                <div className="font-medium">{getStageBadge(tender.stage)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Ответственный</div>
                <div className="font-medium">{tender.responsible}</div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Финансовые показатели</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="text-xs text-gray-600">Плановая сумма</div>
                <div className="text-lg font-bold text-blue-900">{formatCurrency(tender.planned_amount)}</div>
              </div>
              {tender.final_amount && (
                <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                  <div className="text-xs text-gray-600">Итоговая сумма</div>
                  <div className="text-lg font-bold text-green-900">{formatCurrency(tender.final_amount)}</div>
                </div>
              )}
              {tender.savings_amount > 0 && (
                <div className="p-2 bg-emerald-50 rounded border-l-4 border-emerald-500">
                  <div className="text-xs text-gray-600">Экономия</div>
                  <div className="text-lg font-bold text-emerald-900">{formatCurrency(tender.savings_amount)} ({tender.savings_percent}%)</div>
                </div>
              )}
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Количество участников</div>
                <div className="font-medium flex items-center gap-1"><Users size={14} /> {tender.participants_count}</div>
              </div>
              {tender.winner && (
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  <div className="text-xs text-gray-600">Победитель</div>
                  <div className="font-medium text-green-900">{tender.winner}</div>
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Сроки и связи</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Дата создания</div>
                <div className="font-medium">{tender.created_date}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Дедлайн</div>
                <div className="font-medium">{tender.deadline}</div>
              </div>
              {tender.signed_date && (
                <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                  <div className="text-xs text-gray-600">Дата подписания</div>
                  <div className="font-medium text-green-900">{tender.signed_date}</div>
                </div>
              )}
              {tender.linked_igk && (
                <div className="p-2 bg-purple-50 rounded border border-purple-200">
                  <div className="text-xs text-gray-600">Связанный ИГК</div>
                  <div className="font-mono font-medium text-purple-900">{tender.linked_igk}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'risks' && (
        <div>
          {tender.risks.length === 0 ? (
            <div className="p-4 bg-green-50 rounded border border-green-200 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm text-green-900">Риски по тендеру не выявлены</span>
            </div>
          ) : (
            <div className="space-y-2">
              {tender.risks.map((risk, idx) => (
                <div key={idx} className="p-3 bg-red-50 rounded border border-red-200 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-900">{risk}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div className="flex-1">
              <div className="text-xs font-bold text-gray-900">{tender.created_date}</div>
              <div className="text-sm font-medium text-gray-900">Тендер создан</div>
              <div className="text-xs text-gray-600">Инициация закупочной процедуры</div>
            </div>
          </div>
          {(tender.stage !== 'planning') && (
            <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-900">Этап анализа рынка / отправки заявок</div>
                <div className="text-sm font-medium text-gray-900">Работа с поставщиками</div>
                <div className="text-xs text-gray-600">Участников: {tender.participants_count}</div>
              </div>
            </div>
          )}
          {(tender.stage === 'contract_signed' || tender.stage === 'negotiation') && (
            <div className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-lg border border-purple-200">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-900">Переговоры / подписание</div>
                <div className="text-sm font-medium text-gray-900">{tender.winner ? `Победитель: ${tender.winner}` : 'Выбор победителя'}</div>
              </div>
            </div>
          )}
          {tender.signed_date && (
            <div className="flex items-start gap-3 p-3 bg-green-50/50 rounded-lg border border-green-200">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">✓</div>
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-900">{tender.signed_date}</div>
                <div className="text-sm font-medium text-gray-900">Контракт подписан</div>
                {tender.final_amount && (
                  <div className="text-xs text-gray-600">Итоговая сумма: {formatCurrency(tender.final_amount)}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};