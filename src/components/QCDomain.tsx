import React, { useState, useMemo } from 'react';
import { 
  Microscope, AlertTriangle, TrendingUp, Clock, CheckCircle,
  ChevronDown, ChevronRight, Download, BarChart3, 
  PieChart as PieIcon, FileText, AlertCircle, Shield, Award
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { QCResponse, VPPrescription, QCDefect } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0054A6', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

// Все badge-функции на уровне модуля (Правило #30)
const getVPStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    open: { label: '🔴 Открыто', color: 'bg-red-100 text-red-800' },
    in_progress: { label: '🟡 В работе', color: 'bg-yellow-100 text-yellow-800' },
    resolved: { label: '✅ Устранено', color: 'bg-green-100 text-green-800' },
    rejected: { label: '⚫ Отклонено', color: 'bg-gray-100 text-gray-800' },
    escalated: { label: '🟠 Эскалировано', color: 'bg-orange-100 text-orange-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getSeverityBadge = (severity: string) => {
  const config: Record<string, { label: string; color: string }> = {
    critical: { label: '🔴 Критическое', color: 'bg-red-100 text-red-800' },
    high: { label: '🟠 Высокое', color: 'bg-orange-100 text-orange-800' },
    medium: { label: '🟡 Среднее', color: 'bg-yellow-100 text-yellow-800' },
    low: { label: '🟢 Низкое', color: 'bg-green-100 text-green-800' }
  };
  const cfg = config[severity] || { label: severity, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getQCStageBadge = (stage: string) => {
  const config: Record<string, { label: string; color: string }> = {
    incoming: { label: 'Входной', color: 'bg-blue-100 text-blue-800' },
    in_process: { label: 'Операционный', color: 'bg-purple-100 text-purple-800' },
    final: { label: 'Приёмочный', color: 'bg-indigo-100 text-indigo-800' },
    vp_acceptance: { label: 'Приёмка ВП', color: 'bg-orange-100 text-orange-800' },
    customer_acceptance: { label: 'Приёмка заказчиком', color: 'bg-green-100 text-green-800' }
  };
  const cfg = config[stage] || { label: stage, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getDefectTypeBadge = (type: string) => {
  const config: Record<string, { label: string; color: string }> = {
    dimensional: { label: 'Геометрия', color: 'bg-blue-100 text-blue-800' },
    material: { label: 'Материал', color: 'bg-purple-100 text-purple-800' },
    assembly: { label: 'Сборка', color: 'bg-orange-100 text-orange-800' },
    documentation: { label: 'Документы', color: 'bg-gray-100 text-gray-800' },
    functional: { label: 'Функционал', color: 'bg-red-100 text-red-800' }
  };
  const cfg = config[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

interface QCDomainProps {
  data: QCResponse;
}

export const QCDomain: React.FC<QCDomainProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterVPStatus, setFilterVPStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredPrescriptions = useMemo(() => {
    return data.prescriptions.filter(p => {
      if (filterVPStatus !== 'all' && p.status !== filterVPStatus) return false;
      if (filterSeverity !== 'all' && p.severity !== filterSeverity) return false;
      if (filterSearch && !p.description.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !p.number.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.prescriptions, filterVPStatus, filterSeverity, filterSearch]);

  const filteredDefects = useMemo(() => {
    return data.defects.filter(d => {
      if (filterStage !== 'all' && d.stage !== filterStage) return false;
      if (filterSearch && !d.product.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !d.supplier.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.defects, filterStage, filterSearch]);

  // Данные для графиков
  const funnelData = data.funnel.map(f => ({
    name: f.stage_name,
    проверено: f.count,
    отклонено: f.rejected,
    возвращено: f.returned
  }));

  const defectByTypeData = [
    { name: 'Геометрия', value: data.defects.filter(d => d.defect_type === 'dimensional').length },
    { name: 'Материал', value: data.defects.filter(d => d.defect_type === 'material').length },
    { name: 'Сборка', value: data.defects.filter(d => d.defect_type === 'assembly').length },
    { name: 'Документы', value: data.defects.filter(d => d.defect_type === 'documentation').length },
    { name: 'Функционал', value: data.defects.filter(d => d.defect_type === 'functional').length }
  ].filter(d => d.value > 0);

  const defectTrend = [3, 5, 4, 6, 3, data.summary.total_defects];

  // Данные для диаграммы Парето по поставщикам
  const supplierDefectData = data.defects.reduce((acc, d) => {
    const existing = acc.find(x => x.supplier === d.supplier);
    if (existing) {
      existing.amount += d.amount;
      existing.count += 1;
    } else {
      acc.push({ supplier: d.supplier, amount: d.amount, count: 1 });
    }
    return acc;
  }, [] as Array<{ supplier: string; amount: number; count: number }>).sort((a, b) => b.amount - a.amount);

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА (Правило #33) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.open_prescriptions > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Открытые предписания</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertCircle className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.open_prescriptions > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.open_prescriptions}</div>
          <div className="text-xs text-gray-500 mt-1">требуют устранения</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.critical_prescriptions > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Критические</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Shield className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.critical_prescriptions > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.critical_prescriptions}</div>
          <div className="text-xs text-gray-500 mt-1">предписания ВП</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Всего дефектов</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertTriangle className="text-orange-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.total_defects}</div>
          <div className="text-xs text-gray-500 mt-1">за период</div>
          <div className="mt-2">
            <Sparkline data={defectTrend} color="#F97316" />
          </div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.defect_rate_percent > 3 ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Уровень брака</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><TrendingUp className="text-orange-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.defect_rate_percent > 3 ? 'text-orange-700' : 'text-gray-900'}`}>{data.summary.defect_rate_percent.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">от общего объёма</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Ср. срок устранения</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Clock className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.avg_resolution_days.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">дней</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.acceptance_pass_rate < 95 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Приёмка с 1-го раза</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Award className="text-green-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.acceptance_pass_rate < 95 ? 'text-yellow-700' : 'text-gray-900'}`}>{data.summary.acceptance_pass_rate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">успешных приёмов</div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ (Правило #33) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            Воронка приёмки (этапы контроля)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{fontSize: 11}} />
                <YAxis type="category" dataKey="name" tick={{fontSize: 11}} width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="проверено" fill="#0054A6" name="Проверено" />
                <Bar dataKey="отклонено" fill="#DC2626" name="Отклонено" />
                <Bar dataKey="возвращено" fill="#F59E0B" name="Возвращено" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon className="text-red-600" size={20} />
            Дефекты по типам
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={defectByTypeData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                  {defectByTypeData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} случаев`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-orange-600" size={20} />
            Диаграмма Парето: дефекты по поставщикам (сумма ущерба, руб.)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierDefectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplier" tick={{fontSize: 11}} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{fontSize: 11}} tickFormatter={(val) => `${(val/1000000).toFixed(1)}М`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="amount" fill="#DC2626" name="Сумма ущерба" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус предписания:</span>
            <select value={filterVPStatus} onChange={(e) => setFilterVPStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="open">Открыто</option>
              <option value="in_progress">В работе</option>
              <option value="resolved">Устранено</option>
              <option value="rejected">Отклонено</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Серьёзность:</span>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="critical">Критическое</option>
              <option value="high">Высокое</option>
              <option value="medium">Среднее</option>
              <option value="low">Низкое</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Этап контроля:</span>
            <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="incoming">Входной</option>
              <option value="in_process">Операционный</option>
              <option value="final">Приёмочный</option>
              <option value="vp_acceptance">Приёмка ВП</option>
              <option value="customer_acceptance">Приёмка заказчиком</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поиск:</span>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="№ предписания, продукт..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <ExportButton data={[...filteredPrescriptions, ...filteredDefects]} filename="qc_data" />
        </div>
      </div>

      {/* Таблица 1: Предписания ВП - STICKY HEADER (Правило #33) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={18} className="text-red-600" />
            Журнал предписаний военной приёмки
          </h3>
          <ExportButton data={filteredPrescriptions} filename="vp_prescriptions" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">№ предписания</th>
                <th className="px-3 py-3">Дата</th>
                <th className="px-3 py-3">Продукт</th>
                <th className="px-3 py-3">Описание</th>
                <th className="px-3 py-3 text-center">Серьёзность</th>
                <th className="px-3 py-3 text-center">Статус</th>
                <th className="px-3 py-3 text-center">Срок</th>
                <th className="px-3 py-3 text-center">Дней открыто</th>
                <th className="px-3 py-3">Ответственный</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPrescriptions.map((p) => (
                <React.Fragment key={p.id}>
                  <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${p.severity === 'critical' ? 'bg-red-50/30' : p.status === 'open' ? 'bg-orange-50/20' : ''}`} onClick={() => toggleRow(p.id)}>
                    <td className="px-3 py-3">{expandedRow === p.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="px-3 py-3 font-mono text-xs font-bold">{p.number}</td>
                    <td className="px-3 py-3 text-xs">{p.date}</td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">{p.product}</td>
                    <td className="px-3 py-3 text-xs text-gray-700 max-w-xs truncate" title={p.description}>{p.description}</td>
                    <td className="px-3 py-3 text-center">{getSeverityBadge(p.severity)}</td>
                    <td className="px-3 py-3 text-center">{getVPStatusBadge(p.status)}</td>
                    <td className="px-3 py-3 text-center text-xs">{p.deadline}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        p.days_open > 14 ? 'bg-red-100 text-red-800' :
                        p.days_open > 7 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>{p.days_open} дн.</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700">{p.responsible}</td>
                  </tr>
                  {expandedRow === p.id && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={10} className="px-3 py-6">
                        <PrescriptionDetail prescription={p} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица 2: Дефекты - STICKY HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-600" />
            Реестр дефектов и брака
          </h3>
          <ExportButton data={filteredDefects} filename="defects" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3">Дата</th>
                <th className="px-3 py-3">Этап</th>
                <th className="px-3 py-3">Продукт</th>
                <th className="px-3 py-3">Тип дефекта</th>
                <th className="px-3 py-3">Поставщик</th>
                <th className="px-3 py-3 text-center">Кол-во</th>
                <th className="px-3 py-3 text-right">Сумма ущерба</th>
                <th className="px-3 py-3">Описание</th>
                <th className="px-3 py-3">Принятые меры</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDefects.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-xs">{d.date}</td>
                  <td className="px-3 py-3">{getQCStageBadge(d.stage)}</td>
                  <td className="px-3 py-3 text-xs font-medium text-gray-900">{d.product}</td>
                  <td className="px-3 py-3">{getDefectTypeBadge(d.defect_type)}</td>
                  <td className="px-3 py-3 text-xs text-gray-700">{d.supplier}</td>
                  <td className="px-3 py-3 text-center text-xs">{d.quantity}</td>
                  <td className="px-3 py-3 text-right text-xs font-medium text-red-700">{formatCurrency(d.amount)}</td>
                  <td className="px-3 py-3 text-xs text-gray-700 max-w-xs truncate" title={d.description}>{d.description}</td>
                  <td className="px-3 py-3 text-xs text-gray-700">{d.action_taken}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PrescriptionDetail: React.FC<{prescription: VPPrescription}> = ({prescription}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Реквизиты предписания</h4>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Номер</div>
            <div className="font-mono font-bold">{prescription.number}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Дата выдачи</div>
            <div className="font-medium">{prescription.date}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Срок устранения</div>
            <div className="font-medium">{prescription.deadline}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Связанный ИГК</div>
            <div className="font-mono font-medium">{prescription.linked_igk}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Договор</div>
            <div className="font-mono font-medium">{prescription.linked_contract}</div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Содержание предписания</h4>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-red-50 rounded border-l-4 border-red-500">
            <div className="text-xs text-gray-600">Продукция</div>
            <div className="font-medium text-red-900">{prescription.product}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Описание нарушения</div>
            <div className="text-sm text-gray-900">{prescription.description}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Серьёзность</div>
            <div className="font-medium">{getSeverityBadge(prescription.severity)}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Статус</div>
            <div className="font-medium">{getVPStatusBadge(prescription.status)}</div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Устранение</h4>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Ответственный</div>
            <div className="font-medium">{prescription.responsible}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Дней открыто</div>
            <div className={`font-medium ${prescription.days_open > 14 ? 'text-red-700' : prescription.days_open > 7 ? 'text-yellow-700' : 'text-green-700'}`}>
              {prescription.days_open} дн.
            </div>
          </div>
          {prescription.resolution ? (
            <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
              <div className="text-xs text-gray-600">Результат устранения</div>
              <div className="font-medium text-green-900">{prescription.resolution}</div>
            </div>
          ) : (
            <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
              <div className="text-xs text-gray-600">Результат</div>
              <div className="font-medium text-yellow-900">Ещё не устранено</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};