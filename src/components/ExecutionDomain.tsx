import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, TrendingUp, Package, Filter, Clock, AlertCircle,
  ChevronDown, ChevronRight, FileText, CheckCircle, Download,
  Truck, Train, Plane, Navigation, Shield,
  BarChart3, PieChart as PieIcon, LineChart as LineIcon, DollarSign
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { ExecutionResponse, ExpenseContract } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0054A6', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

// Все badge-функции на уровне модуля (Правило #N)
const getTypeBadge = (type: string) => {
  const config: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    pki: { icon: <Package size={12} />, label: 'ПКИ', color: 'bg-blue-100 text-blue-800' },
    materials: { icon: <Package size={12} />, label: 'Материалы', color: 'bg-purple-100 text-purple-800' },
    services: { icon: <FileText size={12} />, label: 'Услуги', color: 'bg-green-100 text-green-800' },
    delivery: { icon: <Truck size={12} />, label: 'Доставка', color: 'bg-orange-100 text-orange-800' },
    shipment: { icon: <Truck size={12} />, label: 'Отгрузка', color: 'bg-pink-100 text-pink-800' }
  };
  const cfg = config[type] || { icon: <Package size={12} />, label: type, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.icon}{cfg.label}</span>;
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

const getDeviationBadge = (days: number) => {
  if (days < 0) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Досрочно {Math.abs(days)} дн.</span>;
  if (days === 0) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">В срок</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Задержка {days} дн.</span>;
};

const getRiskCount = (risks: string[]) => {
  if (risks.length === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={10} /> Нет</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertTriangle size={10} /> {risks.length}</span>;
};

interface ExecutionDomainProps {
  data: ExecutionResponse;
  onNavigateToFinance?: () => void;
}

export const ExecutionDomain: React.FC<ExecutionDomainProps> = ({ data, onNavigateToFinance }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredContracts = useMemo(() => {
    return data.expense_contracts.filter(c => {
      if (filterType !== 'all' && c.type !== filterType) return false;
      if (filterSupplier !== 'all' && c.supplier_name !== filterSupplier) return false;
      if (filterStatus !== 'all' && c.execution_status !== filterStatus) return false;
      if (filterSearch && !c.contract_number.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !c.subject.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.expense_contracts, filterType, filterSupplier, filterStatus, filterSearch]);

  const typeData = [
    { name: 'ПКИ', value: data.expense_contracts.filter(c => c.type === 'pki').length },
    { name: 'Материалы', value: data.expense_contracts.filter(c => c.type === 'materials').length },
    { name: 'Услуги', value: data.expense_contracts.filter(c => c.type === 'services').length },
    { name: 'Доставка', value: data.expense_contracts.filter(c => c.type === 'delivery').length },
    { name: 'Отгрузка', value: data.expense_contracts.filter(c => c.type === 'shipment').length }
  ];

  const statusData = [
    { name: 'Завершено', value: data.expense_contracts.filter(c => c.execution_status === 'completed' || c.execution_status === 'delivered' || c.execution_status === 'accepted').length },
    { name: 'В работе', value: data.expense_contracts.filter(c => c.execution_status === 'in_progress').length },
    { name: 'Просрочено', value: data.expense_contracts.filter(c => c.execution_status === 'overdue').length },
    { name: 'Ожидание', value: data.expense_contracts.filter(c => c.execution_status === 'signing' || c.execution_status === 'waiting_advance').length }
  ];

  const supplierData = [
    { name: 'ТрансЛогистик', value: data.expense_contracts.filter(c => c.supplier_name.includes('ТрансЛогистик')).length },
    { name: 'Деловые Линии', value: data.expense_contracts.filter(c => c.supplier_name.includes('Деловые Линии')).length },
    { name: 'РТ-Логистика', value: data.expense_contracts.filter(c => c.supplier_name.includes('РТ-Логистика')).length },
    { name: 'СДЭК', value: data.expense_contracts.filter(c => c.supplier_name.includes('СДЭК')).length }
  ];

  const executionTrend = [40, 45, 48, 52, 55, 58];
  const uniqueSuppliers = [...new Set(data.expense_contracts.map(c => c.supplier_name))];

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Всего договоров</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><FileText className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.total_expense_contracts}</div>
          <div className="text-xs text-gray-500 mt-1">расходных контрактов</div>
          <div className="mt-2">
            <Sparkline data={executionTrend} color="#0054A6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Общая сумма</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><TrendingUp className="text-purple-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.total_amount)}</div>
          <div className="text-xs text-gray-500 mt-1">по всем договорам</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Оплачено</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><DollarSign className="text-green-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.total_paid)}</div>
          <div className="text-xs text-gray-500 mt-1">{data.summary.payment_percent.toFixed(1)}% от суммы</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.overdue_contracts > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Просрочено</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertTriangle className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.overdue_contracts > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.overdue_contracts}</div>
          <div className="text-xs text-gray-500 mt-1">договоров</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.critical_risks > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Критические риски</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertCircle className="text-orange-500" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.critical_risks > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.critical_risks}</div>
          <div className="text-xs text-gray-500 mt-1">требуют внимания</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors" onClick={onNavigateToFinance}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Платежи</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><DollarSign className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.total_paid)}</div>
          <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
            <span>Подробнее в Финансах</span>
            <ChevronRight size={12} />
          </div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon className="text-blue-600" size={20} />
            Распределение по типам
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                  {typeData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} договоров`} />
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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LineIcon className="text-purple-600" size={20} />
            Топ поставщиков
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 11}} />
                <YAxis tick={{fontSize: 11}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8B5CF6" name="Количество договоров" />
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
              <option value="pki">ПКИ</option>
              <option value="materials">Материалы</option>
              <option value="services">Услуги</option>
              <option value="delivery">Доставка</option>
              <option value="shipment">Отгрузка</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поставщик:</span>
            <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
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
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="№ договора или предмет..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <ExportButton data={filteredContracts} filename="expense_contracts" />
        </div>
      </div>

      {/* Таблица договоров - STICKY HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Реестр расходных договоров (кликните для детализации)</h3>
          <ExportButton data={filteredContracts} filename="expense_contracts_table" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">№ договора</th>
                <th className="px-3 py-3">Доходный / ИГК</th>
                <th className="px-3 py-3">Тип</th>
                <th className="px-3 py-3">Поставщик</th>
                <th className="px-3 py-3">Предмет</th>
                <th className="px-3 py-3 text-right">Сумма</th>
                <th className="px-3 py-3 text-center">% оплаты</th>
                <th className="px-3 py-3 text-center">Плановая поставка</th>
                <th className="px-3 py-3 text-center">Факт</th>
                <th className="px-3 py-3 text-center">Отклонение</th>
                <th className="px-3 py-3">Статус</th>
                <th className="px-3 py-3">Ответств.</th>
                <th className="px-3 py-3 text-center">Риски</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContracts.map((contract) => (
                <React.Fragment key={contract.id}>
                  <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleRow(contract.id)}>
                    <td className="px-3 py-3">{expandedRow === contract.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="px-3 py-3 font-mono text-xs">{contract.contract_number}</td>
                    <td className="px-3 py-3">
                      <div className="font-mono text-xs text-gray-500">{contract.income_contract_id}</div>
                      {contract.igk_code && <div className="text-xs text-gray-600">ИГК: {contract.igk_code.slice(-6)}</div>}
                    </td>
                    <td className="px-3 py-3">{getTypeBadge(contract.type)}</td>
                    <td className="px-3 py-3 text-xs text-gray-700">{contract.supplier_name}</td>
                    <td className="px-3 py-3 text-xs text-gray-900">{contract.subject}</td>
                    <td className="px-3 py-3 text-right font-medium text-xs">{formatCurrency(contract.amount)}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${contract.payment_percent >= 80 ? 'bg-green-500' : contract.payment_percent >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{width: `${contract.payment_percent}%`}}></div>
                        </div>
                        <span className="text-xs">{contract.payment_percent}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-xs">{contract.planned_delivery_date}</td>
                    <td className="px-3 py-3 text-center text-xs">{contract.actual_delivery_date || '—'}</td>
                    <td className="px-3 py-3 text-center">{getDeviationBadge(contract.deviation_days)}</td>
                    <td className="px-3 py-3">{getExecutionStatusBadge(contract.execution_status)}</td>
                    <td className="px-3 py-3 text-xs text-gray-700">{contract.responsible_employee}</td>
                    <td className="px-3 py-3 text-center">{getRiskCount(contract.risks)}</td>
                  </tr>
                  {expandedRow === contract.id && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={14} className="px-3 py-6">
                        <ContractDetail contract={contract} onNavigateToFinance={onNavigateToFinance} />
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

const ContractDetail: React.FC<{contract: ExpenseContract; onNavigateToFinance?: () => void}> = ({contract, onNavigateToFinance}) => {
  const [activeTab, setActiveTab] = useState<'stages' | 'info' | 'finance'>('stages');

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('stages')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'stages' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Этапы исполнения</button>
        <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'info' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Информация о договоре</button>
        <button onClick={() => setActiveTab('finance')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'finance' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>
          Финансы
          {onNavigateToFinance && <span className="ml-1 text-xs">→</span>}
        </button>
      </div>

      {activeTab === 'stages' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Этапы исполнения договора</h4>
          <div className="space-y-3">
            {contract.stages.map((stage, idx) => (
              <div key={idx} className={`flex items-center gap-4 p-4 rounded-lg border ${
                stage.status === 'completed' ? 'border-green-200 bg-green-50/50' : 
                stage.status === 'in_progress' ? 'border-blue-200 bg-blue-50/50' : 
                stage.status === 'overdue' ? 'border-red-200 bg-red-50/50' :
                'border-gray-200 bg-white'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  stage.status === 'completed' ? 'bg-green-500 text-white' : 
                  stage.status === 'in_progress' ? 'bg-blue-500 text-white' :
                  stage.status === 'overdue' ? 'bg-red-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>{idx + 1}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{stage.stage_name}</div>
                  <div className="text-xs text-gray-600">
                    План: {stage.planned_date} | Факт: {stage.actual_date || '—'}
                  </div>
                  {stage.deviation_days !== 0 && (
                    <div className={`text-xs mt-1 ${stage.deviation_days > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stage.deviation_days > 0 ? `Задержка: ${stage.deviation_days} дн.` : `Досрочно: ${Math.abs(stage.deviation_days)} дн.`}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-xs px-3 py-1 rounded ${
                    stage.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    stage.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    stage.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {stage.status === 'completed' ? 'Завершено' : 
                     stage.status === 'in_progress' ? 'В работе' :
                     stage.status === 'overdue' ? 'Просрочено' : 'Ожидает'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Основная информация</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Номер договора</div>
                <div className="font-mono font-medium">{contract.contract_number}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Тип</div>
                <div className="font-medium">{contract.type}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Поставщик</div>
                <div className="font-medium">{contract.supplier_name}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Предмет</div>
                <div className="font-medium">{contract.subject}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Связи</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="text-xs text-gray-600">Доходный контракт</div>
                <div className="font-mono font-medium text-blue-900">{contract.income_contract_id}</div>
              </div>
              {contract.igk_code && (
                <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                  <div className="text-xs text-gray-600">ИГК</div>
                  <div className="font-mono font-medium text-green-900">{contract.igk_code}</div>
                </div>
              )}
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Ответственный</div>
                <div className="font-medium">{contract.responsible_employee}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Документы</h4>
            <div className="space-y-2">
              {contract.documents.length === 0 ? (
                <div className="text-sm text-gray-500">Документы не загружены</div>
              ) : (
                contract.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <FileText className="text-blue-600" size={20} />
                    <span className="text-sm font-medium text-gray-900">{doc}</span>
                    <button className="ml-auto text-xs text-rostech-blue hover:underline flex items-center gap-1">
                      <Download size={12} /> Скачать
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <DollarSign className="text-blue-600 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Финансовая информация по договору</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-600">Сумма договора</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(contract.amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Оплачено</div>
                    <div className="text-lg font-bold text-green-700">{formatCurrency(contract.paid_amount)}</div>
                    <div className="text-xs text-gray-500">{contract.payment_percent}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Аванс</div>
                    <div className="text-lg font-bold text-blue-700">{formatCurrency(contract.advance_amount)}</div>
                    <div className="text-xs text-gray-500">{contract.advance_percent}%</div>
                  </div>
                </div>
                {onNavigateToFinance && (
                  <button 
                    onClick={onNavigateToFinance}
                    className="text-sm text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1"
                  >
                    <span>Перейти к детальной информации о платежах во вкладке "Финансы"</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};