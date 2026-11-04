import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, TrendingUp, Shield, Filter, Clock, CheckCircle,
  ChevronDown, ChevronRight, AlertOctagon, Target, Users,
  BarChart3, PieChart as PieIcon, LineChart as LineIcon, Activity,
  Zap, FileText, AlertCircle, XCircle, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { RisksResponse, ConsolidatedRisk } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

interface RisksDomainProps {
  data: RisksResponse;
}

const getSeverityBadge = (severity: string) => {
  const config: Record<string, { label: string; color: string }> = {
    critical: { label: '🔴 Критический', color: 'bg-red-100 text-red-800' },
    high: { label: '🟠 Высокий', color: 'bg-orange-100 text-orange-800' },
    medium: { label: '🟡 Средний', color: 'bg-yellow-100 text-yellow-800' },
    low: { label: '🟢 Низкий', color: 'bg-green-100 text-green-800' }
  };
  const cfg = config[severity] || { label: severity, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    open: { label: '🔴 Открыт', color: 'bg-red-100 text-red-800' },
    in_progress: { label: '🟡 В работе', color: 'bg-yellow-100 text-yellow-800' },
    closed: { label: '✅ Закрыт', color: 'bg-green-100 text-green-800' },
    mitigated: { label: '🟢 Митигирован', color: 'bg-blue-100 text-blue-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getCategoryBadge = (category: string) => {
  const config: Record<string, { label: string; color: string }> = {
    financial: { label: '💰 Финансовый', color: 'bg-blue-100 text-blue-800' },
    sanction: { label: '🌍 Санкционный', color: 'bg-red-100 text-red-800' },
    deadline: { label: '⏰ Срыв сроков', color: 'bg-orange-100 text-orange-800' },
    document: { label: '📄 Документальный', color: 'bg-gray-100 text-gray-800' },
    quality: { label: '🔬 Качество', color: 'bg-purple-100 text-purple-800' },
    logistics: { label: '🚚 Логистический', color: 'bg-indigo-100 text-indigo-800' },
    compliance: { label: '⚖️ Комплаенс', color: 'bg-yellow-100 text-yellow-800' },
    personnel: { label: '👥 Кадры', color: 'bg-pink-100 text-pink-800' }
  };
  const cfg = config[category] || { label: category, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getSourceBadge = (source: string) => {
  const config: Record<string, { label: string; color: string }> = {
    income: { label: 'Доходные', color: 'bg-green-100 text-green-800' },
    execution: { label: 'Исполнение', color: 'bg-blue-100 text-blue-800' },
    logistics: { label: 'Логистика', color: 'bg-indigo-100 text-indigo-800' },
    warehouse: { label: 'Склад', color: 'bg-purple-100 text-purple-800' },
    efficiency: { label: 'Эффективность', color: 'bg-pink-100 text-pink-800' },
    finance: { label: 'Финансы', color: 'bg-yellow-100 text-yellow-800' }
  };
  const cfg = config[source] || { label: source, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getDepartmentBadge = (dept: string) => {
  const config: Record<string, { label: string; color: string }> = {
    procurement: { label: 'Закупки', color: 'bg-blue-100 text-blue-800' },
    coop: { label: 'Кооперация', color: 'bg-purple-100 text-purple-800' },
    warehouse: { label: 'Склад', color: 'bg-green-100 text-green-800' },
    logistics: { label: 'Логистика', color: 'bg-orange-100 text-orange-800' },
    legal: { label: 'Юридический', color: 'bg-red-100 text-red-800' },
    finance: { label: 'Финансы', color: 'bg-gray-100 text-gray-800' }
  };
  const cfg = config[dept] || { label: dept, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getProbabilityStars = (value: number) => '⭐'.repeat(value) + '☆'.repeat(5 - value);

const getHeatmapColor = (count: number, critical: number, high: number): string => {
  if (critical > 0) return 'bg-red-500 text-white';
  if (high > 0) return 'bg-orange-400 text-white';
  if (count > 2) return 'bg-yellow-400 text-gray-900';
  if (count > 0) return 'bg-green-300 text-gray-900';
  return 'bg-gray-100 text-gray-400';
};

export const RisksDomain: React.FC<RisksDomainProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [heatmapView, setHeatmapView] = useState<'category' | 'department'>('category');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredRisks = useMemo(() => {
    return data.risks.filter(r => {
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      if (filterDepartment !== 'all' && r.department !== filterDepartment) return false;
      if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterSearch && !r.description.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !r.linked_object.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.risks, filterCategory, filterDepartment, filterSeverity, filterStatus, filterSearch]);

  const openRisksTrend = data.trend.map(t => t.total_open);

  const bubbleData = data.risks.map(r => ({
    id: r.id,
    probability: r.probability,
    impact: r.impact,
    risk_level: r.risk_level,
    days_open: r.days_open,
    description: r.description,
    severity: r.severity,
    category: r.category
  }));

  const categoryData = [
    { name: 'Финансовые', count: data.risks.filter(r => r.category === 'financial').length, critical: data.risks.filter(r => r.category === 'financial' && r.severity === 'critical').length },
    { name: 'Санкционные', count: data.risks.filter(r => r.category === 'sanction').length, critical: data.risks.filter(r => r.category === 'sanction' && r.severity === 'critical').length },
    { name: 'Срыв сроков', count: data.risks.filter(r => r.category === 'deadline').length, critical: data.risks.filter(r => r.category === 'deadline' && r.severity === 'critical').length },
    { name: 'Документы', count: data.risks.filter(r => r.category === 'document').length, critical: data.risks.filter(r => r.category === 'document' && r.severity === 'critical').length },
    { name: 'Качество', count: data.risks.filter(r => r.category === 'quality').length, critical: data.risks.filter(r => r.category === 'quality' && r.severity === 'critical').length },
    { name: 'Логистика', count: data.risks.filter(r => r.category === 'logistics').length, critical: data.risks.filter(r => r.category === 'logistics' && r.severity === 'critical').length },
    { name: 'Комплаенс', count: data.risks.filter(r => r.category === 'compliance').length, critical: data.risks.filter(r => r.category === 'compliance' && r.severity === 'critical').length },
    { name: 'Кадры', count: data.risks.filter(r => r.category === 'personnel').length, critical: data.risks.filter(r => r.category === 'personnel' && r.severity === 'critical').length }
  ];

  const trendData = data.trend;

  const heatmapData = useMemo(() => {
    if (heatmapView === 'category') {
      return { rows: ['financial', 'sanction', 'deadline', 'document', 'quality', 'logistics', 'compliance', 'personnel'], cols: ['procurement', 'coop', 'warehouse', 'logistics', 'legal', 'finance'] };
    } else {
      return { rows: ['procurement', 'coop', 'warehouse', 'logistics', 'legal', 'finance'], cols: ['financial', 'sanction', 'deadline', 'document', 'quality', 'logistics', 'compliance', 'personnel'] };
    }
  }, [heatmapView]);

  const getHeatmapCell = (row: string, col: string) => {
    if (heatmapView === 'category') return data.heatmap.find(c => c.category === row && c.department === col);
    return data.heatmap.find(c => c.department === row && c.category === col);
  };

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА (Предложение 5) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.critical_count > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Критических рисков</span>
            <Zap className="text-red-600" size={16} />
          </div>
          <div className={`text-xl font-bold ${data.summary.critical_count > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.critical_count}</div>
          <div className="text-xs text-gray-500 mt-1">требуют внимания</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.open_count > 5 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Открытых рисков</span>
            <AlertCircle className="text-red-600" size={16} />
          </div>
          <div className={`text-xl font-bold ${data.summary.open_count > 5 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.open_count}</div>
          <div className="text-xs text-gray-500 mt-1">без действий</div>
          <div className="mt-2">
            <Sparkline data={openRisksTrend} color="#DC2626" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">В работе</span>
            <Activity className="text-yellow-600" size={16} />
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.in_progress_count}</div>
          <div className="text-xs text-gray-500 mt-1">митигируются</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.closed_this_month > 0 ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Закрыто за месяц</span>
            <CheckCircle className="text-green-600" size={16} />
          </div>
          <div className={`text-xl font-bold ${data.summary.closed_this_month > 0 ? 'text-green-700' : 'text-gray-900'}`}>{data.summary.closed_this_month}</div>
          <div className="text-xs text-gray-500 mt-1">позитивная динамика</div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ (Предложение 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="text-red-600" size={20} />
            Матрица рисков (Вероятность × Влияние)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="probability" name="Вероятность" domain={[0, 6]} tickCount={6} label={{ value: 'Вероятность →', position: 'insideBottom', offset: -10, style: { fontSize: 11 } }} tick={{fontSize: 11}} />
                <YAxis type="number" dataKey="impact" name="Влияние" domain={[0, 6]} tickCount={6} label={{ value: 'Влияние →', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} tick={{fontSize: 11}} />
                <ZAxis type="number" dataKey="days_open" range={[50, 400]} name="Дней открыт" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-gray-200 rounded shadow text-xs">
                        <div className="font-bold">{data.id}</div>
                        <div>{data.description}</div>
                        <div>Вероятность: {data.probability}, Влияние: {data.impact}</div>
                        <div>Уровень: {data.risk_level}</div>
                        <div>Открыт: {data.days_open} дн.</div>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Scatter data={bubbleData} fill="#8884d8">
                  {bubbleData.map((entry, index) => {
                    const color = entry.severity === 'critical' ? '#DC2626' : 
                                  entry.severity === 'high' ? '#F97316' : 
                                  entry.severity === 'medium' ? '#F59E0B' : '#16A34A';
                    return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.7} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600"></span>Критический</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span>Высокий</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>Средний</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600"></span>Низкий</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LineIcon className="text-purple-600" size={20} />
            Динамика рисков по неделям
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{fontSize: 11}} />
                <YAxis tick={{fontSize: 11}} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="opened" stroke="#DC2626" name="Открыто" strokeWidth={2} />
                <Line type="monotone" dataKey="closed" stroke="#16A34A" name="Закрыто" strokeWidth={2} />
                <Line type="monotone" dataKey="total_open" stroke="#0054A6" name="Всего открытых" strokeWidth={2} strokeDasharray="5 5" />
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
              <option value="financial">Финансовые</option>
              <option value="sanction">Санкционные</option>
              <option value="deadline">Срыв сроков</option>
              <option value="document">Документальные</option>
              <option value="quality">Качество</option>
              <option value="logistics">Логистические</option>
              <option value="compliance">Комплаенс</option>
              <option value="personnel">Кадры</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Подразделение:</span>
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="procurement">Закупки</option>
              <option value="coop">Кооперация</option>
              <option value="warehouse">Склад</option>
              <option value="logistics">Логистика</option>
              <option value="legal">Юридический</option>
              <option value="finance">Финансы</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Серьезность:</span>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="critical">Критический</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус:</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="open">Открыт</option>
              <option value="in_progress">В работе</option>
              <option value="closed">Закрыт</option>
              <option value="mitigated">Митигирован</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поиск:</span>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Описание или объект..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <ExportButton data={filteredRisks} filename="risks" />
        </div>
      </div>

      {/* Тепловая карта рисков */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="text-purple-600" size={20} />
            Тепловая карта рисков
          </h3>
          <div className="flex gap-2">
            <button onClick={() => setHeatmapView('category')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${heatmapView === 'category' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>По категориям</button>
            <button onClick={() => setHeatmapView('department')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${heatmapView === 'department' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>По подразделениям</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left"></th>
                {heatmapView === 'category' 
                  ? ['Закупки', 'Кооперация', 'Склад', 'Логистика', 'Юридический', 'Финансы'].map(d => (
                      <th key={d} className="p-2 text-center font-medium text-gray-600">{d}</th>
                    ))
                  : ['Финансовые', 'Санкционные', 'Срыв сроков', 'Документы', 'Качество', 'Логистика', 'Комплаенс', 'Кадры'].map(c => (
                      <th key={c} className="p-2 text-center font-medium text-gray-600">{c}</th>
                    ))
                }
              </tr>
            </thead>
            <tbody>
              {heatmapData.rows.map(row => (
                <tr key={row}>
                  <td className="p-2 font-medium">{heatmapView === 'category' ? getCategoryBadge(row) : getDepartmentBadge(row)}</td>
                  {heatmapData.cols.map(col => {
                    const cell = getHeatmapCell(row, col);
                    const count = cell?.count || 0;
                    const critical = cell?.critical_count || 0;
                    const high = cell?.high_count || 0;
                    return (
                      <td key={col} className={`p-2 text-center rounded ${getHeatmapColor(count, critical, high)}`}>
                        <div className="font-bold">{count}</div>
                        {critical > 0 && <div className="text-xs">🔴{critical}</div>}
                        {high > 0 && <div className="text-xs">🟠{high}</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-500"></span>Есть критические</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-orange-400"></span>Есть высокие</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-yellow-400"></span>Много (&gt;2)</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-300"></span>Есть риски</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></span>Нет рисков</span>
        </div>
      </div>

      {/* Таблица рисков - STICKY HEADER (Предложение 2) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Матрица рисков (кликните для детализации)</h3>
          <ExportButton data={filteredRisks} filename="risks_matrix" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Категория</th>
                <th className="px-3 py-3">Описание</th>
                <th className="px-3 py-3">Источник</th>
                <th className="px-3 py-3">Объект</th>
                <th className="px-3 py-3 text-center">Вер./Влияние</th>
                <th className="px-3 py-3 text-center">Уровень</th>
                <th className="px-3 py-3">Серьезность</th>
                <th className="px-3 py-3 text-center">Дней</th>
                <th className="px-3 py-3">Ответств.</th>
                <th className="px-3 py-3">Подразд.</th>
                <th className="px-3 py-3 text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRisks.map((risk) => (
                <React.Fragment key={risk.id}>
                  <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${risk.severity === 'critical' ? 'bg-red-50/30' : ''}`} onClick={() => toggleRow(risk.id)}>
                    <td className="px-3 py-3">{expandedRow === risk.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="px-3 py-3 font-mono text-xs font-bold">{risk.id}</td>
                    <td className="px-3 py-3">{getCategoryBadge(risk.category)}</td>
                    <td className="px-3 py-3 text-xs text-gray-900 max-w-xs truncate" title={risk.description}>{risk.description}</td>
                    <td className="px-3 py-3">{getSourceBadge(risk.source)}</td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-700 max-w-xs truncate" title={risk.linked_object}>{risk.linked_object}</td>
                    <td className="px-3 py-3 text-center text-xs">{risk.probability}/{risk.impact}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        risk.risk_level >= 20 ? 'bg-red-100 text-red-800' :
                        risk.risk_level >= 12 ? 'bg-orange-100 text-orange-800' :
                        risk.risk_level >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>{risk.risk_level}</span>
                    </td>
                    <td className="px-3 py-3">{getSeverityBadge(risk.severity)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        risk.days_open > 30 ? 'bg-red-100 text-red-800' :
                        risk.days_open > 14 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>{risk.days_open}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700">{risk.responsible}</td>
                    <td className="px-3 py-3">{getDepartmentBadge(risk.department)}</td>
                    <td className="px-3 py-3 text-center">{getStatusBadge(risk.status)}</td>
                  </tr>
                  {expandedRow === risk.id && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={13} className="px-3 py-6">
                        <RiskDetail risk={risk} allRisks={data.risks} />
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

const RiskDetail: React.FC<{risk: ConsolidatedRisk; allRisks: ConsolidatedRisk[]}> = ({risk, allRisks}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'related'>('details');
  const relatedRisks = allRisks.filter(r => risk.related_risks.includes(r.id) || r.related_risks.includes(risk.id));

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('details')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'details' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Детали риска</button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'history' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>История митигации</button>
        <button onClick={() => setActiveTab('related')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'related' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Связанные риски ({relatedRisks.length})</button>
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Основная информация</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">ID риска</div>
                <div className="font-mono font-bold">{risk.id}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Категория</div>
                <div className="font-medium">{getCategoryBadge(risk.category)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Источник</div>
                <div className="font-medium">{getSourceBadge(risk.source)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Связанный объект</div>
                <div className="font-mono font-medium text-xs">{risk.linked_object}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Оценка риска</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Вероятность</div>
                <div className="font-medium">{getProbabilityStars(risk.probability)} ({risk.probability}/5)</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Влияние</div>
                <div className="font-medium">{getProbabilityStars(risk.impact)} ({risk.impact}/5)</div>
              </div>
              <div className="p-2 bg-red-50 rounded border-l-4 border-red-500">
                <div className="text-xs text-gray-600">Уровень риска</div>
                <div className="text-lg font-bold text-red-900">{risk.risk_level} / 25</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Серьезность</div>
                <div className="font-medium">{getSeverityBadge(risk.severity)}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Статус и ответственность</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Статус</div>
                <div className="font-medium">{getStatusBadge(risk.status)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Дата выявления</div>
                <div className="font-medium">{risk.detection_date}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Дней открыт</div>
                <div className="font-medium">{risk.days_open} дн.</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Ответственный</div>
                <div className="font-medium">{risk.responsible}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Подразделение</div>
                <div className="font-medium">{getDepartmentBadge(risk.department)}</div>
              </div>
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="text-xs text-gray-600">Требуемое действие</div>
                <div className="font-medium text-blue-900">{risk.required_action}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">История митигации</h4>
          {risk.mitigation_history.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">Действия по митигации еще не предпринимались</div>
          ) : (
            <div className="space-y-3">
              {risk.mitigation_history.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">{item.date}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">{item.user}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">{item.action}</div>
                    <div className="text-xs text-gray-600">Результат: {item.result}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'related' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Связанные риски (кластер)</h4>
          {relatedRisks.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">Связанные риски не найдены</div>
          ) : (
            <div className="space-y-2">
              {relatedRisks.map(r => (
                <div key={r.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  r.severity === 'critical' ? 'bg-red-50/50 border-red-200' :
                  r.severity === 'high' ? 'bg-orange-50/50 border-orange-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                    r.severity === 'critical' ? 'bg-red-500 text-white' :
                    r.severity === 'high' ? 'bg-orange-500 text-white' :
                    r.severity === 'medium' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>{r.id.replace('CR-', '')}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">{r.id}</span>
                      {getSeverityBadge(r.severity)}
                      {getStatusBadge(r.status)}
                    </div>
                    <div className="text-sm text-gray-900">{r.description}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {r.linked_object} | {r.responsible} | {r.days_open} дн.
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