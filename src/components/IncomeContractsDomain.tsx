import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, TrendingUp, FileText, Filter, Clock, AlertCircle,
  ChevronDown, ChevronRight, CheckCircle, Download, DollarSign,
  PieChart as PieIcon, BarChart3, LineChart as LineIcon, Shield, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { IncomeContractsResponse, IncomeContract } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0054A6', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

// Все badge-функции вынесены на уровень модуля
const getContractTypeBadge = (type: string) => {
  if (type === 'goz') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">🎖️ ГОЗ</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">💼 Коммерческий</span>;
};

const getExecutionStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    signing: { label: 'Подписание', color: 'bg-gray-100 text-gray-800' },
    waiting_advance: { label: 'Ожидание аванса', color: 'bg-yellow-100 text-yellow-800' },
    in_progress: { label: 'В работе', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Завершено', color: 'bg-green-100 text-green-800' },
    overdue: { label: 'Просрочено', color: 'bg-red-100 text-red-800' },
    cancelled: { label: 'Отменено', color: 'bg-gray-100 text-gray-800' },
    delivered: { label: 'Поставлено', color: 'bg-green-100 text-green-800' },
    accepted: { label: 'Принято', color: 'bg-green-100 text-green-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getPaymentStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    advance_received: { label: 'Аванс получен', color: 'bg-blue-100 text-blue-800' },
    waiting_advance: { label: 'Ожидание аванса', color: 'bg-yellow-100 text-yellow-800' },
    partial: { label: 'Частично', color: 'bg-orange-100 text-orange-800' },
    fully_paid: { label: 'Оплачено', color: 'bg-green-100 text-green-800' },
    advance_paid: { label: 'Аванс оплачен', color: 'bg-blue-100 text-blue-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getRiskCount = (risks: string[]) => {
  if (risks.length === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={10} /> Нет</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertTriangle size={10} /> {risks.length}</span>;
};

interface IncomeContractsDomainProps {
  data: IncomeContractsResponse;
}

export const IncomeContractsDomain: React.FC<IncomeContractsDomainProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredContracts = useMemo(() => {
    return data.contracts.filter(c => {
      if (filterType !== 'all' && c.contract_type !== filterType) return false;
      if (filterStatus !== 'all' && c.execution_status !== filterStatus) return false;
      if (filterSearch && !c.contract_number.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !c.subject.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.contracts, filterType, filterStatus, filterSearch]);

  const typeData = [
    { name: 'ГОЗ', value: data.summary.goz_contracts },
    { name: 'Коммерческие', value: data.summary.commercial_contracts }
  ];

  const statusData = [
    { name: 'Завершено', value: data.contracts.filter(c => c.execution_status === 'completed' || c.execution_status === 'delivered' || c.execution_status === 'accepted').length },
    { name: 'В работе', value: data.contracts.filter(c => c.execution_status === 'in_progress').length },
    { name: 'Просрочено', value: data.contracts.filter(c => c.execution_status === 'overdue').length },
    { name: 'Ожидание', value: data.contracts.filter(c => c.execution_status === 'signing' || c.execution_status === 'waiting_advance').length }
  ];

  const monthlyAmounts = [85, 92, 78, 105, 118, 120];

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Всего контрактов</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><FileText className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.total_contracts}</div>
          <div className="text-xs text-gray-500 mt-1">доходных договоров</div>
          <div className="mt-2">
            <Sparkline data={monthlyAmounts} color="#0054A6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Общая сумма</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><DollarSign className="text-purple-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.total_amount)}</div>
          <div className="text-xs text-gray-500 mt-1">по всем контрактам</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Оплачено</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><TrendingUp className="text-green-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.payment_percent.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">{formatCurrency(data.summary.total_paid)}</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.overdue_contracts > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Просрочено</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertTriangle className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.overdue_contracts > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.overdue_contracts}</div>
          <div className="text-xs text-gray-500 mt-1">контрактов</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.risk_contracts > 0 ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">С рисками</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Shield className="text-orange-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.risk_contracts > 0 ? 'text-orange-700' : 'text-gray-900'}`}>{data.summary.risk_contracts}</div>
          <div className="text-xs text-gray-500 mt-1">требуют внимания</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.total_receivable > 100000000 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Дебиторская задолж.</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Clock className="text-orange-500" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.total_receivable > 100000000 ? 'text-yellow-700' : 'text-gray-900'}`}>{formatCurrency(data.summary.total_receivable)}</div>
          <div className="text-xs text-gray-500 mt-1">к поступлению</div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon className="text-blue-600" size={20} />
            Типы контрактов
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                  {typeData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} контрактов`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-green-600" size={20} />
            Статусы исполнения
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
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Тип:</span>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="goz">ГОЗ</option>
              <option value="commercial">Коммерческие</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус:</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="signing">Подписание</option>
              <option value="waiting_advance">Ожидание аванса</option>
              <option value="in_progress">В работе</option>
              <option value="completed">Завершено</option>
              <option value="overdue">Просрочено</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поиск:</span>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="№ контракта или предмет..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <ExportButton data={filteredContracts} filename="income_contracts" />
        </div>
      </div>

      {/* Таблица контрактов - STICKY HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Реестр доходных контрактов (кликните для детализации)</h3>
          <ExportButton data={filteredContracts} filename="income_contracts_table" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">№ контракта</th>
                <th className="px-3 py-3">ИГК</th>
                <th className="px-3 py-3">Тема</th>
                <th className="px-3 py-3">Предмет</th>
                <th className="px-3 py-3">Заказчик</th>
                <th className="px-3 py-3">Тип</th>
                <th className="px-3 py-3 text-right">Сумма</th>
                <th className="px-3 py-3 text-center">% оплаты</th>
                <th className="px-3 py-3 text-center">Срок</th>
                <th className="px-3 py-3 text-center">Дней</th>
                <th className="px-3 py-3">Статус</th>
                <th className="px-3 py-3 text-center">Риски</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContracts.map((contract) => (
                <React.Fragment key={contract.id}>
                  <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${contract.execution_status === 'overdue' ? 'bg-red-50/30' : ''}`} onClick={() => toggleRow(contract.id)}>
                    <td className="px-3 py-3">{expandedRow === contract.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="px-3 py-3 font-mono text-xs font-bold">{contract.contract_number}</td>
                    <td className="px-3 py-3 font-mono text-xs">{contract.igk_code ? contract.igk_code.slice(-6) : '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-700">{contract.theme}</td>
                    <td className="px-3 py-3 text-xs text-gray-900 font-medium">{contract.subject}</td>
                    <td className="px-3 py-3 text-xs text-gray-700">{contract.customer}</td>
                    <td className="px-3 py-3">{getContractTypeBadge(contract.contract_type)}</td>
                    <td className="px-3 py-3 text-right text-xs font-medium">{formatCurrency(contract.total_amount)}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${contract.payment_percent >= 80 ? 'bg-green-500' : contract.payment_percent >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{width: `${contract.payment_percent}%`}}></div>
                        </div>
                        <span className="text-xs">{contract.payment_percent}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-xs">{contract.end_date}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        contract.days_remaining < 0 ? 'bg-red-100 text-red-800' :
                        contract.days_remaining < 30 ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {contract.days_remaining > 0 ? `${contract.days_remaining} дн.` : contract.days_remaining < 0 ? `${contract.days_remaining} дн.` : '0'}
                      </span>
                    </td>
                    <td className="px-3 py-3">{getExecutionStatusBadge(contract.execution_status)}</td>
                    <td className="px-3 py-3 text-center">{getRiskCount(contract.risks)}</td>
                  </tr>
                  {expandedRow === contract.id && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={13} className="px-3 py-6">
                        <ContractDetail contract={contract} />
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

const ContractDetail: React.FC<{contract: IncomeContract}> = ({contract}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'finance' | 'documents' | 'log'>('details');

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('details')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'details' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Детали контракта</button>
        <button onClick={() => setActiveTab('finance')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'finance' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Финансы</button>
        <button onClick={() => setActiveTab('documents')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'documents' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Документы ({contract.documents.length})</button>
        <button onClick={() => setActiveTab('log')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'log' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>История статусов ({contract.status_log.length})</button>
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Реквизиты контракта</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Номер контракта</div>
                <div className="font-mono font-bold">{contract.contract_number}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">ИГК</div>
                <div className="font-mono font-medium">{contract.igk_code || '—'}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Тема</div>
                <div className="font-medium">{contract.theme}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Предмет</div>
                <div className="font-medium">{contract.subject}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Заказчик</div>
                <div className="font-medium">{contract.customer}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Сроки и статус</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Дата подписания</div>
                <div className="font-medium">{contract.signing_date}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Срок исполнения</div>
                <div className="font-medium">{contract.end_date}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Дней осталось</div>
                <div className={`font-medium ${contract.days_remaining < 0 ? 'text-red-700' : contract.days_remaining < 30 ? 'text-orange-700' : 'text-green-700'}`}>
                  {contract.days_remaining > 0 ? `${contract.days_remaining} дн.` : contract.days_remaining < 0 ? `Просрочено на ${Math.abs(contract.days_remaining)} дн.` : 'Завершено'}
                </div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Статус исполнения</div>
                <div className="font-medium">{getExecutionStatusBadge(contract.execution_status)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Статус оплаты</div>
                <div className="font-medium">{getPaymentStatusBadge(contract.payment_status)}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Банковские реквизиты</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Банк</div>
                <div className="font-medium">{contract.bank_name}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Расчетный счет</div>
                <div className="font-mono font-medium">{contract.bank_account}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Корр. счет</div>
                <div className="font-mono font-medium">{contract.corr_account}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">БИК</div>
                <div className="font-mono font-medium">{contract.bik}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">ИНН/КПП</div>
                <div className="font-mono font-medium">{contract.inn_kpp}</div>
              </div>
              {contract.separate_account && (
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="text-xs text-gray-600">Отдельный счет (275-ФЗ)</div>
                  <div className="font-mono font-medium text-blue-900">{contract.separate_account}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Финансовые показатели</h4>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Общая сумма контракта</div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(contract.total_amount)}</div>
              </div>
              <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                <div className="text-xs text-gray-600">Оплачено</div>
                <div className="text-lg font-bold text-green-900">{formatCurrency(contract.paid_amount)}</div>
                <div className="text-xs text-gray-600 mt-1">{contract.payment_percent}% от суммы</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                <div className="text-xs text-gray-600">Дебиторская задолженность</div>
                <div className="text-lg font-bold text-yellow-900">{formatCurrency(contract.receivable_amount)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Структура затрат</div>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span>ПКИ:</span>
                    <span className="font-medium">{formatCurrency(contract.pki_cost)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Материалы:</span>
                    <span className="font-medium">{formatCurrency(contract.materials_cost)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Логистика:</span>
                    <span className="font-medium">{formatCurrency(contract.logistics_cost)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Риски контракта</h4>
            {contract.risks.length === 0 ? (
              <div className="p-4 bg-green-50 rounded border border-green-200">
                <div className="flex items-center gap-2 text-sm text-green-900">
                  <CheckCircle size={16} />
                  <span>Риски не выявлены</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {contract.risks.map((risk, idx) => (
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
        </div>
      )}

      {activeTab === 'documents' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Документы по контракту</h4>
          {contract.documents.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">Документы не загружены</div>
          ) : (
            <div className="space-y-2">
              {contract.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <FileText className="text-blue-600" size={20} />
                  <span className="text-sm font-medium text-gray-900">{doc}</span>
                  <button className="ml-auto text-xs text-rostech-blue hover:underline flex items-center gap-1">
                    <Download size={12} /> Скачать
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'log' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">История изменения статусов</h4>
          {contract.status_log.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">История статусов пуста</div>
          ) : (
            <div className="space-y-3">
              {contract.status_log.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">{entry.date}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">{entry.user}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">Статус: {entry.status}</div>
                    <div className="text-xs text-gray-600">{entry.comment}</div>
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