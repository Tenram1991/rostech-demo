import React, { useState, useMemo } from 'react';
import { 
  Handshake, AlertTriangle, TrendingUp, Shield, Award,
  ChevronDown, ChevronRight, Download, BarChart3, 
  PieChart as PieIcon, Target as RadarIcon, MapPin,
  AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { SupplierResponse, Supplier, SupplierDependency } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0054A6', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

// Все badge-функции на уровне модуля (Правило #30)
const getRatingBadge = (rating: string) => {
  const config: Record<string, { label: string; color: string }> = {
    A: { label: '🏆 Класс A', color: 'bg-green-100 text-green-800' },
    B: { label: '✅ Класс B', color: 'bg-blue-100 text-blue-800' },
    C: { label: '⚠️ Класс C', color: 'bg-yellow-100 text-yellow-800' },
    D: { label: '🔴 Класс D', color: 'bg-red-100 text-red-800' }
  };
  const cfg = config[rating] || { label: rating, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getRiskBadge = (risk: string) => {
  const config: Record<string, { label: string; color: string }> = {
    low: { label: '🟢 Низкий', color: 'bg-green-100 text-green-800' },
    medium: { label: '🟡 Средний', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: '🟠 Высокий', color: 'bg-orange-100 text-orange-800' },
    critical: { label: '🔴 Критический', color: 'bg-red-100 text-red-800' }
  };
  const cfg = config[risk] || { label: risk, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getSoleSourceBadge = (isSole: boolean) => {
  if (isSole) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertCircle size={10} /> Единственный</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={10} /> Есть альтернативы</span>;
};

const getSanctionedBadge = (isSanctioned: boolean) => {
  if (isSanctioned) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><XCircle size={10} /> Под санкциями</span>;
  return null;
};

interface SupplierDomainProps {
  data: SupplierResponse;
}

export const SupplierDomain: React.FC<SupplierDomainProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredSuppliers = useMemo(() => {
    return data.suppliers.filter(s => {
      if (filterRating !== 'all' && s.rating !== filterRating) return false;
      if (filterRisk !== 'all' && s.risk !== filterRisk) return false;
      if (filterSearch && !s.name.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !s.inn.includes(filterSearch)) return false;
      return true;
    });
  }, [data.suppliers, filterRating, filterRisk, filterSearch]);

  const filteredDependencies = useMemo(() => {
    return data.dependencies.filter(d => {
      if (filterSearch && !d.igk_subject.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.dependencies, filterSearch]);

  // Данные для графиков
  const ratingData = [
    { name: 'Класс A', value: data.suppliers.filter(s => s.rating === 'A').length },
    { name: 'Класс B', value: data.suppliers.filter(s => s.rating === 'B').length },
    { name: 'Класс C', value: data.suppliers.filter(s => s.rating === 'C').length },
    { name: 'Класс D', value: data.suppliers.filter(s => s.rating === 'D').length }
  ].filter(d => d.value > 0);

  // Данные для Radar Chart (сравнение топ-3 поставщиков)
  const topSuppliers = data.suppliers
    .sort((a, b) => b.reliability_score - a.reliability_score)
    .slice(0, 3);

  const radarData = [
    { subject: 'Своевременность', A: topSuppliers[0]?.on_time_percent || 0, B: topSuppliers[1]?.on_time_percent || 0, C: topSuppliers[2]?.on_time_percent || 0, fullMark: 100 },
    { subject: 'Качество', A: topSuppliers[0]?.quality_percent || 0, B: topSuppliers[1]?.quality_percent || 0, C: topSuppliers[2]?.quality_percent || 0, fullMark: 100 },
    { subject: 'Цена', A: (2 - (topSuppliers[0]?.price_index || 1)) * 50, B: (2 - (topSuppliers[1]?.price_index || 1)) * 50, C: (2 - (topSuppliers[2]?.price_index || 1)) * 50, fullMark: 100 }, // Инвертируем: чем меньше индекс, тем лучше
    { subject: 'Надёжность', A: topSuppliers[0]?.reliability_score || 0, B: topSuppliers[1]?.reliability_score || 0, C: topSuppliers[2]?.reliability_score || 0, fullMark: 100 }
  ];

  const incidentTrend = [2, 1, 3, 2, 4, data.summary.total_incidents];

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА (Правило #33) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Всего поставщиков</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Handshake className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.total_suppliers}</div>
          <div className="text-xs text-gray-500 mt-1">в реестре</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.sole_source_count > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Единственные источники</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertCircle className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.sole_source_count > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.sole_source_count}</div>
          <div className="text-xs text-gray-500 mt-1">высокий риск</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.sanctioned_count > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Под санкциями</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Shield className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.sanctioned_count > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.sanctioned_count}</div>
          <div className="text-xs text-gray-500 mt-1">юр. лиц</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Средний рейтинг</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Award className="text-green-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.avg_rating_score.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">из 100</div>
          <div className="mt-2">
            <Sparkline data={[80, 81, 82, 82.5, 82.9, data.summary.avg_rating_score]} color="#16A34A" />
          </div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.high_risk_count > 0 ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Высокий/Крит. риск</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertTriangle className="text-orange-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.high_risk_count > 0 ? 'text-orange-700' : 'text-gray-900'}`}>{data.summary.high_risk_count}</div>
          <div className="text-xs text-gray-500 mt-1">поставщиков</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.total_incidents > 5 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Всего инцидентов</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><TrendingUp className="text-yellow-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.total_incidents > 5 ? 'text-yellow-700' : 'text-gray-900'}`}>{data.summary.total_incidents}</div>
          <div className="text-xs text-gray-500 mt-1">за период</div>
          <div className="mt-2">
            <Sparkline data={incidentTrend} color="#F59E0B" />
          </div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ (Правило #33) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon className="text-blue-600" size={20} />
            Распределение по классам надёжности
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ratingData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                  {ratingData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} поставщиков`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <RadarIcon className="text-purple-600" size={20} />
            Сравнение топ-3 поставщиков
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{fontSize: 11}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fontSize: 11}} />
                <Radar name={topSuppliers[0]?.name || 'A'} dataKey="A" stroke="#0054A6" fill="#0054A6" fillOpacity={0.3} />
                <Radar name={topSuppliers[1]?.name || 'B'} dataKey="B" stroke="#16A34A" fill="#16A34A" fillOpacity={0.3} />
                <Radar name={topSuppliers[2]?.name || 'C'} dataKey="C" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-green-600" size={20} />
            Матрица зависимости ИГК от критических поставщиков
          </h3>
          <div className="h-80 overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%" minWidth={800}>
              <BarChart data={filteredDependencies} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{fontSize: 11}} />
                <YAxis type="category" dataKey="igk_subject" tick={{fontSize: 11}} width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="critical_suppliers_count" fill="#DC2626" name="Критических поставщиков" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Рейтинг:</span>
            <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="A">Класс A</option>
              <option value="B">Класс B</option>
              <option value="C">Класс C</option>
              <option value="D">Класс D</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Уровень риска:</span>
            <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="critical">Критический</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поиск:</span>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Название или ИНН..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <ExportButton data={filteredSuppliers} filename="suppliers" />
        </div>
      </div>

      {/* Таблица 1: Реестр поставщиков - STICKY HEADER (Правило #33) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Handshake size={18} className="text-blue-600" />
            Реестр поставщиков (Supplier 360)
          </h3>
          <ExportButton data={filteredSuppliers} filename="suppliers_registry" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">Наименование</th>
                <th className="px-3 py-3">ИНН</th>
                <th className="px-3 py-3">Регион</th>
                <th className="px-3 py-3 text-center">Рейтинг</th>
                <th className="px-3 py-3 text-center">Риск</th>
                <th className="px-3 py-3 text-center">Своевременность</th>
                <th className="px-3 py-3 text-center">Качество</th>
                <th className="px-3 py-3 text-right">Общая сумма</th>
                <th className="px-3 py-3 text-center">Инциденты</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSuppliers.map((s) => (
                <React.Fragment key={s.id}>
                  <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${s.risk === 'critical' || s.risk === 'high' ? 'bg-red-50/20' : ''}`} onClick={() => toggleRow(s.id)}>
                    <td className="px-3 py-3">{expandedRow === s.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-gray-900">{s.name}</div>
                      <div className="flex gap-1 mt-1">
                        {getSoleSourceBadge(s.is_sole)}
                        {getSanctionedBadge(s.is_sanctioned)}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{s.inn}</td>
                    <td className="px-3 py-3 text-xs text-gray-700 flex items-center gap-1"><MapPin size={12} /> {s.region}</td>
                    <td className="px-3 py-3 text-center">{getRatingBadge(s.rating)}</td>
                    <td className="px-3 py-3 text-center">{getRiskBadge(s.risk)}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${s.on_time_percent >= 90 ? 'bg-green-500' : s.on_time_percent >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${s.on_time_percent}%`}}></div>
                        </div>
                        <span className="text-xs">{s.on_time_percent}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${s.quality_percent >= 95 ? 'bg-green-500' : s.quality_percent >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${s.quality_percent}%`}}></div>
                        </div>
                        <span className="text-xs">{s.quality_percent}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-medium">{formatCurrency(s.total_amount)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${s.incidents_count > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {s.incidents_count}
                      </span>
                    </td>
                  </tr>
                  {expandedRow === s.id && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={10} className="px-3 py-6">
                        <SupplierDetail supplier={s} dependencies={data.dependencies.filter(d => d.critical_suppliers.includes(s.id))} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица 2: Матрица зависимостей - STICKY HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-600" />
            Матрица рисков единственного источника (Sole Source)
          </h3>
          <ExportButton data={filteredDependencies.filter(d => d.sole_source_risk)} filename="sole_source_risks" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3">ИГК</th>
                <th className="px-3 py-3">Наименование продукции</th>
                <th className="px-3 py-3">Критические поставщики</th>
                <th className="px-3 py-3 text-center">Риск единственного источника</th>
                <th className="px-3 py-3">Альтернативные поставщики</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDependencies.filter(d => d.sole_source_risk).map((d, idx) => (
                <tr key={idx} className="hover:bg-gray-50 bg-red-50/10">
                  <td className="px-3 py-3 font-mono text-xs">{d.igk_code}</td>
                  <td className="px-3 py-3 text-xs font-medium text-gray-900">{d.igk_subject}</td>
                  <td className="px-3 py-3 text-xs text-gray-700">{d.critical_suppliers.join(', ')}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle size={10} /> Высокий
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700">
                    {d.alternative_suppliers.length > 0 ? d.alternative_suppliers.join(', ') : <span className="text-red-600 font-medium">Отсутствуют</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SupplierDetail: React.FC<{supplier: Supplier; dependencies: SupplierDependency[]}> = ({supplier, dependencies}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'dependencies' | 'certs'>('info');

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'info' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Информация</button>
        <button onClick={() => setActiveTab('dependencies')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'dependencies' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Зависимости ИГК ({dependencies.length})</button>
        <button onClick={() => setActiveTab('certs')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'certs' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Сертификаты ({supplier.certifications.length})</button>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Реквизиты</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Наименование</div>
                <div className="font-medium">{supplier.name}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">ИНН</div>
                <div className="font-mono font-medium">{supplier.inn}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Регион</div>
                <div className="font-medium flex items-center gap-1"><MapPin size={12} /> {supplier.region}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Продукция</div>
                <div className="text-xs font-medium">{supplier.products.join(', ')}</div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Показатели эффективности</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="text-xs text-gray-600">Индекс надёжности</div>
                <div className="text-lg font-bold text-blue-900">{supplier.reliability_score}/100</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Своевременность поставок</div>
                <div className="font-medium">{supplier.on_time_percent}%</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Качество продукции</div>
                <div className="font-medium">{supplier.quality_percent}%</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Ценовой индекс</div>
                <div className={`font-medium ${supplier.price_index > 1.1 ? 'text-red-700' : 'text-green-700'}`}>{supplier.price_index}x</div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Риски и статус</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Общий рейтинг</div>
                <div className="font-medium">{getRatingBadge(supplier.rating)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Уровень риска</div>
                <div className="font-medium">{getRiskBadge(supplier.risk)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Единственный источник</div>
                <div className="font-medium">{getSoleSourceBadge(supplier.is_sole)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Под санкциями</div>
                <div className="font-medium">{getSanctionedBadge(supplier.is_sanctioned) || <span className="text-green-700">Нет</span>}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Всего инцидентов</div>
                <div className="font-medium">{supplier.incidents_count} (последний: {supplier.last_incident_date || 'нет'})</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dependencies' && (
        <div>
          {dependencies.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">Нет критических зависимостей по ИГК</div>
          ) : (
            <div className="space-y-3">
              {dependencies.map((dep, idx) => (
                <div key={idx} className="p-3 bg-red-50/50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-red-600" />
                    <span className="text-sm font-bold text-gray-900">{dep.igk_subject} ({dep.igk_code})</span>
                  </div>
                  <div className="text-xs text-gray-700">
                    <span className="font-semibold">Альтернативы:</span> {dep.alternative_suppliers.length > 0 ? dep.alternative_suppliers.join(', ') : 'Отсутствуют (критический риск)'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'certs' && (
        <div>
          {supplier.certifications.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">Сертификаты не указаны</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {supplier.certifications.map((cert, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-900">
                  <Award size={12} /> {cert}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};