import React, { useState, useMemo } from 'react';
import { 
  Landmark, AlertTriangle, TrendingUp, Shield, FileText,
  ChevronDown, ChevronRight, Download, BarChart3, 
  PieChart as PieIcon, AlertCircle, CheckCircle, XCircle,
  DollarSign, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { TreasuryResponse, OBSAccount, TreasuryReport, Penalty } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0054A6', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

// Все badge-функции на уровне модуля (Правило #30)
const getOBSStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    normal: { label: '✅ Норма', color: 'bg-green-100 text-green-800' },
    warning: { label: '⚠️ Внимание', color: 'bg-yellow-100 text-yellow-800' },
    blocked: { label: '🔴 Заблокирован', color: 'bg-red-100 text-red-800' },
    audit: { label: '🔍 Проверка', color: 'bg-blue-100 text-blue-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getReportStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    draft: { label: '📝 Черновик', color: 'bg-gray-100 text-gray-800' },
    sent: { label: '📤 Отправлен', color: 'bg-blue-100 text-blue-800' },
    accepted: { label: '✅ Принят', color: 'bg-green-100 text-green-800' },
    rejected: { label: '❌ Отклонён', color: 'bg-red-100 text-red-800' },
    overdue: { label: '⏰ Просрочен', color: 'bg-orange-100 text-orange-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getPenaltyStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    accrued: { label: 'Начислено', color: 'bg-red-100 text-red-800' },
    paid: { label: 'Оплачено', color: 'bg-green-100 text-green-800' },
    disputed: { label: 'Оспаривается', color: 'bg-yellow-100 text-yellow-800' },
    cancelled: { label: 'Отменено', color: 'bg-gray-100 text-gray-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getPenaltyTypeBadge = (type: string) => {
  const config: Record<string, { label: string; color: string }> = {
    customer: { label: 'От Заказчика', color: 'bg-blue-100 text-blue-800' },
    treasury: { label: 'От Казначейства', color: 'bg-purple-100 text-purple-800' },
    contractor: { label: 'От подрядчика', color: 'bg-orange-100 text-orange-800' }
  };
  const cfg = config[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

interface TreasuryDomainProps {
  data: TreasuryResponse;
}

export const TreasuryDomain: React.FC<TreasuryDomainProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterOBSStatus, setFilterOBSStatus] = useState<string>('all');
  const [filterReportStatus, setFilterReportStatus] = useState<string>('all');
  const [filterPenaltyStatus, setFilterPenaltyStatus] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredAccounts = useMemo(() => {
    return data.obs_accounts.filter(a => {
      if (filterOBSStatus !== 'all' && a.status !== filterOBSStatus) return false;
      if (filterSearch && !a.igk_code.includes(filterSearch) && !a.contract_number.includes(filterSearch)) return false;
      return true;
    });
  }, [data.obs_accounts, filterOBSStatus, filterSearch]);

  const filteredReports = useMemo(() => {
    return data.reports.filter(r => {
      if (filterReportStatus !== 'all' && r.status !== filterReportStatus) return false;
      if (filterSearch && !r.period.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.reports, filterReportStatus, filterSearch]);

  const filteredPenalties = useMemo(() => {
    return data.penalties.filter(p => {
      if (filterPenaltyStatus !== 'all' && p.status !== filterPenaltyStatus) return false;
      if (filterSearch && !p.description.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.penalties, filterPenaltyStatus, filterSearch]);

  // Данные для графиков
  const obsBalanceData = data.obs_accounts.map(a => ({
    name: a.igk_code.slice(-6),
    остаток: a.balance,
    лимит: a.limit_amount
  }));

  const reportStatusData = [
    { name: 'Принятые', value: data.reports.filter(r => r.status === 'accepted').length },
    { name: 'Отправленные', value: data.reports.filter(r => r.status === 'sent').length },
    { name: 'Отклонённые', value: data.reports.filter(r => r.status === 'rejected').length },
    { name: 'Черновики', value: data.reports.filter(r => r.status === 'draft').length }
  ].filter(d => d.value > 0);

  const penaltyTrend = [500000, 180000, 0, 2500000, 0, data.summary.total_penalties];

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА (Правило #33) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Остаток на ОБС</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><DollarSign className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.total_obs_balance)}</div>
          <div className="text-xs text-gray-500 mt-1">по всем ИГК</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Использование лимита</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><TrendingUp className="text-purple-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.limit_usage_percent.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">от общего лимита</div>
          <div className="mt-2">
            <Sparkline data={[45, 48, 50, 52, 54, data.summary.limit_usage_percent]} color="#8B5CF6" />
          </div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.blocked_accounts > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Заблокированные счета</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><XCircle className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.blocked_accounts > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.blocked_accounts}</div>
          <div className="text-xs text-gray-500 mt-1">счетов</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Принятые отчёты</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><CheckCircle className="text-green-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.accepted_reports}</div>
          <div className="text-xs text-gray-500 mt-1">в Казначейство</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.overdue_reports > 0 ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Просроченные отчёты</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertCircle className="text-orange-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.overdue_reports > 0 ? 'text-orange-700' : 'text-gray-900'}`}>{data.summary.overdue_reports}</div>
          <div className="text-xs text-gray-500 mt-1">отчётов</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.total_penalties > 1000000 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Штрафы и пени</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertTriangle className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.total_penalties > 1000000 ? 'text-red-700' : 'text-gray-900'}`}>{formatCurrency(data.summary.total_penalties)}</div>
          <div className="text-xs text-gray-500 mt-1">всего начислено</div>
          <div className="mt-2">
            <Sparkline data={penaltyTrend} color="#DC2626" />
          </div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ (Правило #33) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            Остатки по счетам ОБС (млн руб.)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={obsBalanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 11}} />
                <YAxis tick={{fontSize: 11}} tickFormatter={(val) => `${(val/1000000).toFixed(0)}М`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="остаток" fill="#0054A6" name="Остаток" />
                <Bar dataKey="лимит" fill="#E5E7EB" name="Лимит" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon className="text-green-600" size={20} />
            Статусы отчётов в Казначейство
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reportStatusData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                  {reportStatusData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} отчётов`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-red-600" size={20} />
            Динамика штрафов и пеней (руб.)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: 'Июнь', amount: 500000 },
                { month: 'Июль', amount: 180000 },
                { month: 'Авг', amount: 0 },
                { month: 'Сен', amount: 2500000 },
                { month: 'Окт', amount: 0 },
                { month: 'Ноя', amount: data.summary.total_penalties }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{fontSize: 11}} />
                <YAxis tick={{fontSize: 11}} tickFormatter={(val) => `${(val/1000000).toFixed(1)}М`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="amount" stroke="#DC2626" fill="#FEE2E2" name="Штрафы и пени" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус ОБС:</span>
            <select value={filterOBSStatus} onChange={(e) => setFilterOBSStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="normal">Норма</option>
              <option value="warning">Внимание</option>
              <option value="blocked">Заблокирован</option>
              <option value="audit">Проверка</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус отчёта:</span>
            <select value={filterReportStatus} onChange={(e) => setFilterReportStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="accepted">Принят</option>
              <option value="sent">Отправлен</option>
              <option value="rejected">Отклонён</option>
              <option value="draft">Черновик</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус штрафа:</span>
            <select value={filterPenaltyStatus} onChange={(e) => setFilterPenaltyStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="accrued">Начислено</option>
              <option value="paid">Оплачено</option>
              <option value="disputed">Оспаривается</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поиск:</span>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="ИГК, договор, период..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <ExportButton data={[...filteredAccounts, ...filteredReports, ...filteredPenalties]} filename="treasury_data" />
        </div>
      </div>

      {/* Таблица 1: Счета ОБС - STICKY HEADER (Правило #33) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Landmark size={18} className="text-blue-600" />
            Отдельные банковские счета (ОБС) по ИГК
          </h3>
          <ExportButton data={filteredAccounts} filename="obs_accounts" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">ИГК</th>
                <th className="px-3 py-3">Договор</th>
                <th className="px-3 py-3">Банк</th>
                <th className="px-3 py-3 text-right">Остаток</th>
                <th className="px-3 py-3 text-right">Лимит</th>
                <th className="px-3 py-3 text-center">% использования</th>
                <th className="px-3 py-3 text-center">Статус</th>
                <th className="px-3 py-3">Последняя операция</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.map((acc) => (
                <React.Fragment key={acc.igk_code}>
                  <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${acc.status === 'blocked' ? 'bg-red-50/30' : acc.status === 'warning' ? 'bg-yellow-50/20' : ''}`} onClick={() => toggleRow(acc.igk_code)}>
                    <td className="px-3 py-3">{expandedRow === acc.igk_code ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="px-3 py-3 font-mono text-xs font-bold">{acc.igk_code}</td>
                    <td className="px-3 py-3 font-mono text-xs">{acc.contract_number}</td>
                    <td className="px-3 py-3 text-xs text-gray-700">{acc.bank_name}</td>
                    <td className="px-3 py-3 text-right text-xs font-medium">{formatCurrency(acc.balance)}</td>
                    <td className="px-3 py-3 text-right text-xs">{formatCurrency(acc.limit_amount)}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${acc.limit_used_percent >= 100 ? 'bg-red-500' : acc.limit_used_percent >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${Math.min(100, acc.limit_used_percent)}%`}}></div>
                        </div>
                        <span className="text-xs font-bold">{acc.limit_used_percent}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">{getOBSStatusBadge(acc.status)}</td>
                    <td className="px-3 py-3 text-xs">{acc.last_transaction_date}</td>
                  </tr>
                  {expandedRow === acc.igk_code && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={9} className="px-3 py-6">
                        <AccountDetail account={acc} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица 2: Отчёты в Казначейство - STICKY HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={18} className="text-green-600" />
            Отчётность в Казначейство
          </h3>
          <ExportButton data={filteredReports} filename="treasury_reports" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3">Период</th>
                <th className="px-3 py-3">Тип</th>
                <th className="px-3 py-3 text-center">Статус</th>
                <th className="px-3 py-3 text-center">Дата отправки</th>
                <th className="px-3 py-3 text-center">Дата принятия</th>
                <th className="px-3 py-3 text-center">Кол-во ИГК</th>
                <th className="px-3 py-3 text-right">Общая сумма</th>
                <th className="px-3 py-3">Причина отклонения</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.map((r) => (
                <tr key={r.id} className={`hover:bg-gray-50 ${r.status === 'rejected' ? 'bg-red-50/20' : r.status === 'overdue' ? 'bg-orange-50/20' : ''}`}>
                  <td className="px-3 py-3 text-xs font-medium text-gray-900">{r.period}</td>
                  <td className="px-3 py-3 text-xs">{r.type === 'monthly' ? 'Месячный' : r.type === 'quarterly' ? 'Квартальный' : 'Годовой'}</td>
                  <td className="px-3 py-3 text-center">{getReportStatusBadge(r.status)}</td>
                  <td className="px-3 py-3 text-center text-xs">{r.sent_date || '—'}</td>
                  <td className="px-3 py-3 text-center text-xs">{r.accepted_date || '—'}</td>
                  <td className="px-3 py-3 text-center text-xs">{r.igk_count}</td>
                  <td className="px-3 py-3 text-right text-xs font-medium">{formatCurrency(r.total_amount)}</td>
                  <td className="px-3 py-3 text-xs text-gray-700">{r.rejection_reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица 3: Штрафы и пени - STICKY HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600" />
            Реестр штрафов и пеней
          </h3>
          <ExportButton data={filteredPenalties} filename="penalties" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3">Дата</th>
                <th className="px-3 py-3">Тип</th>
                <th className="px-3 py-3">Описание</th>
                <th className="px-3 py-3">Связанный ИГК</th>
                <th className="px-3 py-3 text-right">Сумма</th>
                <th className="px-3 py-3 text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPenalties.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${p.status === 'accrued' ? 'bg-red-50/10' : ''}`}>
                  <td className="px-3 py-3 text-xs">{p.date}</td>
                  <td className="px-3 py-3">{getPenaltyTypeBadge(p.type)}</td>
                  <td className="px-3 py-3 text-xs text-gray-900">{p.description}</td>
                  <td className="px-3 py-3 text-xs font-mono text-gray-700">{p.linked_igk ? p.linked_igk.slice(-6) : '—'}</td>
                  <td className="px-3 py-3 text-right text-xs font-bold text-red-700">{formatCurrency(p.amount)}</td>
                  <td className="px-3 py-3 text-center">{getPenaltyStatusBadge(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AccountDetail: React.FC<{account: OBSAccount}> = ({account}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Реквизиты счёта</h4>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">ИГК</div>
            <div className="font-mono font-bold">{account.igk_code}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Договор</div>
            <div className="font-mono font-medium">{account.contract_number}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Банк</div>
            <div className="font-medium">{account.bank_name}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Номер счёта</div>
            <div className="font-mono font-medium">{account.account_number}</div>
          </div>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Финансовые показатели</h4>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
            <div className="text-xs text-gray-600">Текущий остаток</div>
            <div className="text-lg font-bold text-blue-900">{formatCurrency(account.balance)}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Лимит использования</div>
            <div className="font-medium">{formatCurrency(account.limit_amount)}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Использовано</div>
            <div className="font-medium">{account.limit_used_percent}%</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Статус</div>
            <div className="font-medium">{getOBSStatusBadge(account.status)}</div>
          </div>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Риски и операции</h4>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-600">Последняя операция</div>
            <div className="font-medium">{account.last_transaction_date}</div>
          </div>
          {account.risks.length > 0 ? (
            <div className="p-2 bg-red-50 rounded border border-red-200">
              <div className="text-xs text-gray-600 mb-1">Выявленные риски:</div>
              {account.risks.map((risk, idx) => (
                <div key={idx} className="text-xs text-red-900 flex items-start gap-1">
                  <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 bg-green-50 rounded border border-green-200">
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <CheckCircle size={12} /> Риски не выявлены
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};