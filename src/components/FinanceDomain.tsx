import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, TrendingUp, DollarSign, Clock, AlertCircle,
  ChevronDown, ChevronRight, FileText, CheckCircle, Wallet,
  ArrowUpRight, ArrowDownRight, PieChart as PieIcon, BarChart3,
  LineChart as LineIcon, AlertOctagon, Calendar, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart
} from 'recharts';
import { FinanceResponse, CashFlowPeriod, Payment, SeparateAccount } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0054A6', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

interface FinanceDomainProps {
  data: FinanceResponse;
  onNavigateToExecution?: () => void;
}

export const FinanceDomain: React.FC<FinanceDomainProps> = ({ data, onNavigateToExecution }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<CashFlowPeriod>('month');
  const [filterIGK, setFilterIGK] = useState<string>('all');
  const [filterPaymentDirection, setFilterPaymentDirection] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterAccountStatus, setFilterAccountStatus] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredCashFlow = useMemo(() => {
    return data.cash_flow.filter(cf => cf.period_type === filterPeriod);
  }, [data.cash_flow, filterPeriod]);

  const filteredPayments = useMemo(() => {
    return data.payments.filter(p => {
      if (filterPaymentDirection !== 'all' && p.direction !== filterPaymentDirection) return false;
      if (filterPaymentStatus !== 'all' && p.status !== filterPaymentStatus) return false;
      if (filterIGK !== 'all' && p.igk_code !== filterIGK) return false;
      if (filterSearch && !p.description.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !p.counterparty.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.payments, filterPaymentDirection, filterPaymentStatus, filterIGK, filterSearch]);

  const filteredAccounts = useMemo(() => {
    return data.separate_accounts.filter(acc => {
      if (filterAccountStatus !== 'all' && acc.status !== filterAccountStatus) return false;
      if (filterIGK !== 'all' && acc.igk_code !== filterIGK) return false;
      return true;
    });
  }, [data.separate_accounts, filterAccountStatus, filterIGK]);

  const monthlyReceived = data.cash_flow
    .filter(cf => cf.period_type === 'month')
    .slice(-6)
    .map(cf => cf.actual_inbound);
  
  const monthlyPaid = data.cash_flow
    .filter(cf => cf.period_type === 'month')
    .slice(-6)
    .map(cf => cf.actual_outbound);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      normal: { label: '✅ Норма', color: 'bg-green-100 text-green-800' },
      deficit: { label: '🔴 Дефицит', color: 'bg-red-100 text-red-800' },
      surplus: { label: '🟡 Излишек', color: 'bg-yellow-100 text-yellow-800' },
      blocked: { label: '⚫ Заблокирован', color: 'bg-gray-100 text-gray-800' }
    };
    const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      planned: { label: 'Запланировано', color: 'bg-gray-100 text-gray-800' },
      received: { label: 'Поступило', color: 'bg-green-100 text-green-800' },
      sent: { label: 'Выплачено', color: 'bg-blue-100 text-blue-800' },
      overdue: { label: 'Просрочено', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Отменено', color: 'bg-gray-100 text-gray-800' }
    };
    const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
  };

  const getPaymentTypeBadge = (type: string) => {
    const config: Record<string, { label: string; color: string }> = {
      advance: { label: 'Аванс', color: 'bg-purple-100 text-purple-800' },
      intermediate: { label: 'Промежуточный', color: 'bg-blue-100 text-blue-800' },
      final: { label: 'Финальный', color: 'bg-green-100 text-green-800' },
      penalty: { label: 'Штраф', color: 'bg-red-100 text-red-800' }
    };
    const cfg = config[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
  };

  const getRiskCount = (risks: string[]) => {
    if (risks.length === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={10} /> Нет</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertTriangle size={10} /> {risks.length}</span>;
  };

  const cashFlowChartData = filteredCashFlow.map(cf => ({
    period: cf.period,
    поступления: cf.actual_inbound,
    выплаты: cf.actual_outbound,
    сальдо: cf.balance,
    планПоступлений: cf.planned_inbound,
    планВыплат: cf.planned_outbound
  }));

  const accountBalanceData = data.separate_accounts.map(acc => ({
    name: acc.igk_code.slice(-6),
    остаток: acc.account_balance,
    использовано: acc.paid_to_suppliers
  }));

  const uniqueIGK = [...new Set(data.separate_accounts.map(a => a.igk_code))];
  const planPercent = (data.summary.total_received / data.summary.total_income_amount) * 100;

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА (Предложение 5) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Поступления от заказчиков</span>
            <ArrowUpRight className="text-green-600" size={16} />
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.total_received)}</div>
          <div className="text-xs text-gray-500 mt-1">{planPercent.toFixed(1)}% от плана</div>
          <div className="mt-2">
            <Sparkline data={monthlyReceived} color="#16A34A" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Выплаты поставщикам</span>
            <ArrowDownRight className="text-red-600" size={16} />
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.total_paid_to_suppliers)}</div>
          <div className="text-xs text-gray-500 mt-1">по расходным договорам</div>
          <div className="mt-2">
            <Sparkline data={monthlyPaid} color="#DC2626" />
          </div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.cash_gap_amount > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Кассовый разрыв</span>
            <AlertOctagon className="text-red-600" size={16} />
          </div>
          <div className={`text-xl font-bold ${data.summary.cash_gap_amount > 0 ? 'text-red-700' : 'text-gray-900'}`}>
            {formatCurrency(data.summary.cash_gap_amount)}
          </div>
          <div className="text-xs text-gray-500 mt-1">сумма отрицательных сальдо</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.receivable_amount > 100000000 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Дебиторская задолж.</span>
            <Clock className="text-orange-500" size={16} />
          </div>
          <div className={`text-xl font-bold ${data.summary.receivable_amount > 100000000 ? 'text-yellow-700' : 'text-gray-900'}`}>
            {formatCurrency(data.summary.receivable_amount)}
          </div>
          <div className="text-xs text-gray-500 mt-1">к поступлению</div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ (Предложение 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LineIcon className="text-blue-600" size={20} />
            Динамика поступлений vs выплат
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlowChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{fontSize: 11}} />
                <YAxis tickFormatter={(val) => `${(val/1000000).toFixed(0)}М`} tick={{fontSize: 11}} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="поступления" fill="#16A34A" />
                <Bar dataKey="выплаты" fill="#DC2626" />
                <Line type="monotone" dataKey="сальдо" stroke="#0054A6" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-green-600" size={20} />
            Остатки по отдельным счетам ИГК
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accountBalanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 11}} />
                <YAxis tickFormatter={(val) => `${(val/1000000).toFixed(0)}М`} tick={{fontSize: 11}} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="остаток" fill="#0054A6" name="Остаток" />
                <Bar dataKey="использовано" fill="#F59E0B" name="Использовано" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Платежный календарь с экспортом - STICKY HEADER (Предложение 2) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              Платежный календарь
            </h3>
            {onNavigateToExecution && (
              <button 
                onClick={onNavigateToExecution}
                className="text-sm text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>Связанные договоры → Исполнение</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilterPeriod('month')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filterPeriod === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Месяц</button>
            <button onClick={() => setFilterPeriod('quarter')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filterPeriod === 'quarter' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Квартал</button>
            <button onClick={() => setFilterPeriod('halfyear')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filterPeriod === 'halfyear' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Полугодие</button>
            <button onClick={() => setFilterPeriod('year')} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filterPeriod === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Год</button>
            <ExportButton data={filteredCashFlow} filename="cash_flow" columns={['period', 'planned_inbound', 'actual_inbound', 'planned_outbound', 'actual_outbound', 'balance', 'cash_gap']} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3">Период</th>
                <th className="px-3 py-3 text-right">План поступлений</th>
                <th className="px-3 py-3 text-right">Факт поступлений</th>
                <th className="px-3 py-3 text-right">План выплат</th>
                <th className="px-3 py-3 text-right">Факт выплат</th>
                <th className="px-3 py-3 text-right">Сальдо</th>
                <th className="px-3 py-3 text-center">Кассовый разрыв</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCashFlow.map((cf, idx) => (
                <tr key={idx} className={`hover:bg-gray-50 ${cf.cash_gap ? 'bg-red-50/30' : ''}`}>
                  <td className="px-3 py-3 font-medium text-gray-900">{cf.period}</td>
                  <td className="px-3 py-3 text-right text-xs">{formatCurrency(cf.planned_inbound)}</td>
                  <td className="px-3 py-3 text-right text-xs">
                    <span className={cf.actual_inbound < cf.planned_inbound ? 'text-red-700 font-medium' : 'text-green-700 font-medium'}>
                      {formatCurrency(cf.actual_inbound)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-xs">{formatCurrency(cf.planned_outbound)}</td>
                  <td className="px-3 py-3 text-right text-xs">
                    <span className={cf.actual_outbound > cf.planned_outbound ? 'text-red-700 font-medium' : 'text-green-700 font-medium'}>
                      {formatCurrency(cf.actual_outbound)}
                    </span>
                  </td>
                  <td className={`px-3 py-3 text-right text-xs font-bold ${cf.balance < 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {formatCurrency(cf.balance)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {cf.cash_gap ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle size={10} /> Да
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={10} /> Нет
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица отдельных счетов ИГК с экспортом - STICKY HEADER (Предложение 2) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Отдельные счета по ИГК (275-ФЗ)</h3>
          <div className="flex flex-wrap gap-2">
            <select value={filterIGK} onChange={(e) => setFilterIGK(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все ИГК</option>
              {uniqueIGK.map(igk => <option key={igk} value={igk}>{igk.slice(-6)}</option>)}
            </select>
            <select value={filterAccountStatus} onChange={(e) => setFilterAccountStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все статусы</option>
              <option value="normal">Норма</option>
              <option value="deficit">Дефицит</option>
              <option value="surplus">Излишек</option>
            </select>
            <ExportButton data={filteredAccounts} filename="separate_accounts" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">ИГК</th>
                <th className="px-3 py-3">Контракт</th>
                <th className="px-3 py-3">Заказчик</th>
                <th className="px-3 py-3 text-right">Сумма</th>
                <th className="px-3 py-3 text-right">Поступило</th>
                <th className="px-3 py-3 text-right">Остаток на счете</th>
                <th className="px-3 py-3 text-center">% исп.</th>
                <th className="px-3 py-3">Статус</th>
                <th className="px-3 py-3 text-center">Риски</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.map((acc) => (
                <React.Fragment key={acc.igk_code}>
                  <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleRow(acc.igk_code)}>
                    <td className="px-3 py-3">{expandedRow === acc.igk_code ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="px-3 py-3 font-mono text-xs">{acc.igk_code}</td>
                    <td className="px-3 py-3 text-xs text-gray-700">{acc.contract_number}</td>
                    <td className="px-3 py-3 text-xs text-gray-700">{acc.customer}</td>
                    <td className="px-3 py-3 text-right text-xs font-medium">{formatCurrency(acc.total_amount)}</td>
                    <td className="px-3 py-3 text-right text-xs">
                      <div>{formatCurrency(acc.received_amount)}</div>
                      <div className="text-gray-500">{acc.received_percent}%</div>
                    </td>
                    <td className={`px-3 py-3 text-right text-xs font-bold ${acc.account_balance < 10000000 ? 'text-red-700' : 'text-gray-900'}`}>
                      {formatCurrency(acc.account_balance)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${acc.limit_usage_percent > 90 ? 'bg-red-500' : acc.limit_usage_percent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${acc.limit_usage_percent}%`}}></div>
                        </div>
                        <span className="text-xs">{acc.limit_usage_percent}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">{getStatusBadge(acc.status)}</td>
                    <td className="px-3 py-3 text-center">{getRiskCount(acc.risks)}</td>
                  </tr>
                  {expandedRow === acc.igk_code && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={10} className="px-3 py-6">
                        <AccountDetail account={acc} payments={data.payments.filter(p => p.igk_code === acc.igk_code)} getStatusBadge={getStatusBadge} getPaymentTypeBadge={getPaymentTypeBadge} getPaymentStatusBadge={getPaymentStatusBadge} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Таблица платежей с экспортом - STICKY HEADER (Предложение 2) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Реестр платежей</h3>
          <div className="flex flex-wrap gap-2">
            <select value={filterPaymentDirection} onChange={(e) => setFilterPaymentDirection(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все направления</option>
              <option value="inbound">Входящие</option>
              <option value="outbound">Исходящие</option>
            </select>
            <select value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все статусы</option>
              <option value="received">Поступило</option>
              <option value="sent">Выплачено</option>
              <option value="planned">Запланировано</option>
            </select>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Поиск..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
            <ExportButton data={filteredPayments} filename="payments" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3">Дата</th>
                <th className="px-3 py-3">Напр.</th>
                <th className="px-3 py-3">Тип</th>
                <th className="px-3 py-3">ИГК</th>
                <th className="px-3 py-3">Контрагент</th>
                <th className="px-3 py-3">Описание</th>
                <th className="px-3 py-3 text-right">Сумма</th>
                <th className="px-3 py-3 text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-xs">{payment.date}</td>
                  <td className="px-3 py-3">
                    {payment.direction === 'inbound' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <ArrowUpRight size={10} /> Вх.
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        <ArrowDownRight size={10} /> Исх.
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">{getPaymentTypeBadge(payment.type)}</td>
                  <td className="px-3 py-3 font-mono text-xs">{payment.igk_code ? payment.igk_code.slice(-6) : '—'}</td>
                  <td className="px-3 py-3 text-xs text-gray-700">{payment.counterparty}</td>
                  <td className="px-3 py-3 text-xs text-gray-900">{payment.description}</td>
                  <td className={`px-3 py-3 text-right text-xs font-bold ${payment.direction === 'inbound' ? 'text-green-700' : 'text-red-700'}`}>
                    {payment.direction === 'inbound' ? '+' : '-'}{formatCurrency(payment.amount)}
                  </td>
                  <td className="px-3 py-3 text-center">{getPaymentStatusBadge(payment.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AccountDetail: React.FC<{
  account: SeparateAccount; 
  payments: Payment[];
  getStatusBadge: (status: string) => JSX.Element;
  getPaymentTypeBadge: (type: string) => JSX.Element;
  getPaymentStatusBadge: (status: string) => JSX.Element;
}> = ({account, payments, getStatusBadge, getPaymentTypeBadge, getPaymentStatusBadge}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'payments' | 'forecast'>('details');

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('details')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'details' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Детали счета</button>
        <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'payments' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>История платежей</button>
        <button onClick={() => setActiveTab('forecast')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'forecast' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Прогноз на 3 месяца</button>
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Реквизиты счета</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">ИГК</div>
                <div className="font-mono font-medium">{account.igk_code}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Контракт</div>
                <div className="font-medium">{account.contract_number}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Банк</div>
                <div className="font-medium">{account.bank_name}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Номер счета</div>
                <div className="font-mono font-medium">{account.account_number}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Финансовые показатели</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Сумма контракта</div>
                <div className="font-medium">{formatCurrency(account.total_amount)}</div>
              </div>
              <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                <div className="text-xs text-gray-600">Поступило от заказчика</div>
                <div className="font-medium text-green-900">{formatCurrency(account.received_amount)} ({account.received_percent}%)</div>
              </div>
              <div className="p-2 bg-red-50 rounded border-l-4 border-red-500">
                <div className="text-xs text-gray-600">Выплачено поставщикам</div>
                <div className="font-medium text-red-900">{formatCurrency(account.paid_to_suppliers)}</div>
              </div>
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="text-xs text-gray-600">Остаток на счете</div>
                <div className="font-medium text-blue-900">{formatCurrency(account.account_balance)}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Статус и риски</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Статус финансирования</div>
                <div className="font-medium">{getStatusBadge(account.status)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">% использования лимита</div>
                <div className="font-medium">{account.limit_usage_percent}%</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Последняя операция</div>
                <div className="font-medium">{account.last_operation_date}</div>
              </div>
              {account.risks.length > 0 && (
                <div className="p-2 bg-red-50 rounded border border-red-200">
                  <div className="text-xs text-gray-600 mb-1">Риски:</div>
                  {account.risks.map((risk, idx) => (
                    <div key={idx} className="text-xs text-red-900 flex items-start gap-1">
                      <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">История платежей по ИГК {account.igk_code.slice(-6)}</h4>
          {payments.length === 0 ? (
            <div className="text-sm text-gray-500">Платежи не найдены</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left">Дата</th>
                    <th className="px-3 py-2 text-left">Направление</th>
                    <th className="px-3 py-2 text-left">Тип</th>
                    <th className="px-3 py-2 text-left">Контрагент</th>
                    <th className="px-3 py-2 text-left">Описание</th>
                    <th className="px-3 py-2 text-right">Сумма</th>
                    <th className="px-3 py-2 text-center">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs">{payment.date}</td>
                      <td className="px-3 py-2">
                        {payment.direction === 'inbound' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <ArrowUpRight size={10} /> Вх.
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            <ArrowDownRight size={10} /> Исх.
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">{getPaymentTypeBadge(payment.type)}</td>
                      <td className="px-3 py-2 text-xs">{payment.counterparty}</td>
                      <td className="px-3 py-2 text-xs">{payment.description}</td>
                      <td className={`px-3 py-2 text-right text-xs font-bold ${payment.direction === 'inbound' ? 'text-green-700' : 'text-red-700'}`}>
                        {payment.direction === 'inbound' ? '+' : '-'}{formatCurrency(payment.amount)}
                      </td>
                      <td className="px-3 py-2 text-center">{getPaymentStatusBadge(payment.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'forecast' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Прогноз движения денег на 3 месяца</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Ноябрь 2026', 'Декабрь 2026', 'Январь 2027'].map((month, idx) => {
              const inbound = [15000000, 40000000, 25000000][idx];
              const outbound = [20000000, 35000000, 15000000][idx];
              const balance = inbound - outbound;
              return (
                <div key={month} className={`p-4 rounded-lg border ${balance < 0 ? 'bg-red-50/50 border-red-200' : 'bg-green-50/50 border-green-200'}`}>
                  <div className="text-sm font-semibold text-gray-900 mb-2">{month}</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Поступления:</span>
                      <span className="font-medium text-green-700">{formatCurrency(inbound)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Выплаты:</span>
                      <span className="font-medium text-red-700">{formatCurrency(outbound)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className="font-semibold">Сальдо:</span>
                      <span className={`font-bold ${balance < 0 ? 'text-red-700' : 'text-green-700'}`}>{formatCurrency(balance)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};