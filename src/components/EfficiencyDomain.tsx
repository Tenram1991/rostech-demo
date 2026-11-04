import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, TrendingUp, Users, Filter, Clock, AlertCircle,
  ChevronDown, ChevronRight, FileText, CheckCircle, Download,
  BarChart3, PieChart as PieIcon, LineChart as LineChartIcon, 
  Award, Briefcase, GraduationCap, Target
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { EfficiencyResponse, Employee } from '../types';
import { Sparkline } from './Sparkline';
import { ExportButton } from './ExportButton';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#0054A6', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899'];

// Все badge-функции на уровне модуля (Правило #N)
const getWorkloadStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    underloaded: { label: '🟢 Недогружен', color: 'bg-green-100 text-green-800' },
    normal: { label: '✅ Норма', color: 'bg-blue-100 text-blue-800' },
    overloaded: { label: '🔴 Перегружен', color: 'bg-red-100 text-red-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getTrainingStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    current: { label: '✅ Действует', color: 'bg-green-100 text-green-800' },
    expiring: { label: '🟡 Истекает', color: 'bg-yellow-100 text-yellow-800' },
    expired: { label: '🔴 Истекло', color: 'bg-red-100 text-red-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${cfg.color}`}>{cfg.label}</span>;
};

const getOverallStatusBadge = (status: string) => {
  const config: Record<string, { label: string; color: string }> = {
    low: { label: '🟢 Низкий', color: 'bg-green-100 text-green-800' },
    medium: { label: '🟡 Средний', color: 'bg-yellow-100 text-yellow-800' },
    high: { label: '🟠 Высокий', color: 'bg-orange-100 text-orange-800' },
    critical: { label: '🔴 Критический', color: 'bg-red-100 text-red-800' }
  };
  const cfg = config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
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

const getRiskCount = (count: number) => {
  if (count === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={10} /> Нет</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertTriangle size={10} /> {count}</span>;
};

interface EfficiencyDomainProps {
  data: EfficiencyResponse;
}

export const EfficiencyDomain: React.FC<EfficiencyDomainProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTraining, setFilterTraining] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const filteredEmployees = useMemo(() => {
    return data.employees.filter(e => {
      if (filterDepartment !== 'all' && e.department !== filterDepartment) return false;
      if (filterStatus !== 'all' && e.overall_status !== filterStatus) return false;
      if (filterTraining !== 'all' && e.training_status !== filterTraining) return false;
      if (filterSearch && !e.name.toLowerCase().includes(filterSearch.toLowerCase()) && 
          !e.position.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    });
  }, [data.employees, filterDepartment, filterStatus, filterTraining, filterSearch]);

  const workloadData = [
    { name: 'Недогружены', value: data.employees.filter(e => e.workload_status === 'underloaded').length },
    { name: 'Норма', value: data.employees.filter(e => e.workload_status === 'normal').length },
    { name: 'Перегружены', value: data.employees.filter(e => e.workload_status === 'overloaded').length }
  ];

  const departmentData = data.departments
    .filter(d => d.employee_count > 0)
    .map(d => ({
      name: d.name,
      сотрудников: d.employee_count,
      эффективность: d.avg_efficiency
    }));

  const efficiencyTrend = [88, 90, 89, 92, 91, 93];
  const uniqueDepartments = [...new Set(data.employees.map(e => e.department))];

  return (
    <div>
      {/* KPI Карточки - АДАПТИВНАЯ СЕТКА */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Всего сотрудников</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Users className="text-blue-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.total_employees}</div>
          <div className="text-xs text-gray-500 mt-1">в отделе закупок</div>
          <div className="mt-2">
            <Sparkline data={efficiencyTrend} color="#0054A6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Средняя загрузка</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Briefcase className="text-purple-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.avg_workload.toFixed(0)}%</div>
          <div className="text-xs text-gray-500 mt-1">по всем сотрудникам</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Средняя эффективность</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><TrendingUp className="text-green-600" size={16} /></div>
          </div>
          <div className="text-xl font-bold text-gray-900">{data.summary.avg_efficiency.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">SLA выполнения</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.employees_at_risk > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">В зоне риска</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><AlertCircle className="text-red-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.employees_at_risk > 0 ? 'text-red-700' : 'text-gray-900'}`}>{data.summary.employees_at_risk}</div>
          <div className="text-xs text-gray-500 mt-1">сотрудников</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.expired_training > 0 ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Просрочено обучение</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><GraduationCap className="text-orange-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.expired_training > 0 ? 'text-orange-700' : 'text-gray-900'}`}>{data.summary.expired_training}</div>
          <div className="text-xs text-gray-500 mt-1">сотрудников</div>
        </div>

        <div className={`bg-white p-4 rounded-xl shadow-sm border ${data.summary.total_risk_amount > 100000000 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium">Сумма рисков</span>
            <div className="p-1.5 bg-gray-100 rounded-lg"><Target className="text-yellow-600" size={16} /></div>
          </div>
          <div className={`text-xl font-bold ${data.summary.total_risk_amount > 100000000 ? 'text-yellow-700' : 'text-gray-900'}`}>{formatCurrency(data.summary.total_risk_amount)}</div>
          <div className="text-xs text-gray-500 mt-1">под управлением</div>
        </div>
      </div>

      {/* Графики - ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon className="text-blue-600" size={20} />
            Распределение по загрузке
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={workloadData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                  {workloadData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} сотрудников`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="text-green-600" size={20} />
            Эффективность по подразделениям
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 11}} />
                <YAxis yAxisId="left" tick={{fontSize: 11}} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{fontSize: 11}} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="сотрудников" fill="#0054A6" name="Сотрудников" />
                <Bar yAxisId="right" dataKey="эффективность" fill="#16A34A" name="Эффективность %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <LineChartIcon className="text-purple-600" size={20} />
            Динамика эффективности команды (%)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { month: 'Июл', value: 88 },
                { month: 'Авг', value: 90 },
                { month: 'Сен', value: 89 },
                { month: 'Окт', value: 92 },
                { month: 'Ноя', value: 91 },
                { month: 'Дек', value: 93 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{fontSize: 11}} />
                <YAxis domain={[80, 100]} tickFormatter={(val) => `${val}%`} tick={{fontSize: 11}} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8B5CF6" name="Эффективность" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Подразделение:</span>
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              {uniqueDepartments.map(d => <option key={d} value={d}>{getDepartmentBadge(d)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Статус риска:</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="critical">Критический</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Обучение:</span>
            <select value={filterTraining} onChange={(e) => setFilterTraining(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm">
              <option value="all">Все</option>
              <option value="current">Действует</option>
              <option value="expiring">Истекает</option>
              <option value="expired">Истекло</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Поиск:</span>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="ФИО или должность..." className="px-3 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <ExportButton data={filteredEmployees} filename="employees" />
        </div>
      </div>

      {/* Таблица сотрудников - STICKY HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Команда отдела закупок (кликните для детализации)</h3>
          <ExportButton data={filteredEmployees} filename="employees_table" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3"></th>
                <th className="px-3 py-3">ФИО</th>
                <th className="px-3 py-3">Должность</th>
                <th className="px-3 py-3">Подразделение</th>
                <th className="px-3 py-3 text-center">Загрузка</th>
                <th className="px-3 py-3 text-center">Эффективность</th>
                <th className="px-3 py-3 text-center">Задач</th>
                <th className="px-3 py-3 text-center">Просрочено</th>
                <th className="px-3 py-3 text-center">Обучение</th>
                <th className="px-3 py-3 text-right">Сумма рисков</th>
                <th className="px-3 py-3 text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((employee) => (
                <React.Fragment key={employee.id}>
                  <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${employee.overall_status === 'critical' ? 'bg-red-50/30' : employee.overall_status === 'high' ? 'bg-orange-50/30' : ''}`} onClick={() => toggleRow(employee.id)}>
                    <td className="px-3 py-3">{expandedRow === employee.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-gray-900">{employee.name}</div>
                      {employee.is_manager && <div className="text-xs text-blue-600">👔 Руководитель</div>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700">{employee.position}</td>
                    <td className="px-3 py-3">{getDepartmentBadge(employee.department)}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${
                            employee.workload_percent > 100 ? 'bg-red-500' : 
                            employee.workload_percent > 85 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`} style={{width: `${Math.min(100, employee.workload_percent)}%`}}></div>
                        </div>
                        <span className="text-xs">{employee.workload_percent}%</span>
                      </div>
                      <div className="mt-1">{getWorkloadStatusBadge(employee.workload_status)}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-bold ${
                        employee.efficiency_sla >= 90 ? 'text-green-700' : 
                        employee.efficiency_sla >= 80 ? 'text-yellow-700' : 
                        'text-red-700'
                      }`}>{employee.efficiency_sla.toFixed(1)}%</span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs">
                      <div className="font-medium">{employee.completed_tasks}/{employee.total_tasks}</div>
                      <div className="text-gray-500">выполнено</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        employee.overdue_tasks > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>{employee.overdue_tasks}</span>
                    </td>
                    <td className="px-3 py-3 text-center">{getTrainingStatusBadge(employee.training_status)}</td>
                    <td className="px-3 py-3 text-right text-xs font-medium">{formatCurrency(employee.risk_amount)}</td>
                    <td className="px-3 py-3 text-center">{getOverallStatusBadge(employee.overall_status)}</td>
                  </tr>
                  {expandedRow === employee.id && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={11} className="px-3 py-6">
                        <EmployeeDetail employee={employee} />
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

const EmployeeDetail: React.FC<{employee: Employee}> = ({employee}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'incidents'>('info');

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'info' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Информация</button>
        <button onClick={() => setActiveTab('tasks')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'tasks' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Задачи ({employee.tasks.length})</button>
        <button onClick={() => setActiveTab('incidents')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'incidents' ? 'bg-rostech-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Инциденты ({employee.incidents.length})</button>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Основная информация</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">ФИО</div>
                <div className="font-medium">{employee.name}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Должность</div>
                <div className="font-medium">{employee.position}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Подразделение</div>
                <div className="font-medium">{getDepartmentBadge(employee.department)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Руководитель</div>
                <div className="font-medium">{employee.is_manager ? '✅ Да' : '❌ Нет'}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Показатели эффективности</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="text-xs text-gray-600">Загрузка</div>
                <div className="text-lg font-bold text-blue-900">{employee.workload_percent}%</div>
                <div className="text-xs text-gray-600 mt-1">{getWorkloadStatusBadge(employee.workload_status)}</div>
              </div>
              <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                <div className="text-xs text-gray-600">Эффективность (SLA)</div>
                <div className="text-lg font-bold text-green-900">{employee.efficiency_sla.toFixed(1)}%</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Задачи выполнено/всего</div>
                <div className="font-medium">{employee.completed_tasks} / {employee.total_tasks}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Просрочено задач</div>
                <div className={`font-medium ${employee.overdue_tasks > 0 ? 'text-red-700' : 'text-green-700'}`}>{employee.overdue_tasks}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Обучение и статус</h4>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Статус обучения</div>
                <div className="font-medium">{getTrainingStatusBadge(employee.training_status)}</div>
              </div>
              {employee.training_expiry_date && (
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Истекает</div>
                  <div className="font-medium">{employee.training_expiry_date}</div>
                </div>
              )}
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Общий статус риска</div>
                <div className="font-medium">{getOverallStatusBadge(employee.overall_status)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Сумма рисков под управлением</div>
                <div className="font-medium">{formatCurrency(employee.risk_amount)}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Инициатив</div>
                <div className="font-medium">{employee.initiatives}</div>
              </div>
              {employee.certifications.length > 0 && (
                <div className="p-2 bg-purple-50 rounded border border-purple-200">
                  <div className="text-xs text-gray-600 mb-1">Сертификаты:</div>
                  {employee.certifications.map((cert, idx) => (
                    <div key={idx} className="text-xs text-purple-900">• {cert}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Задачи сотрудника</h4>
          {employee.tasks.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">Задачи не назначены</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left">Описание</th>
                    <th className="px-3 py-2 text-left">Тип</th>
                    <th className="px-3 py-2 text-left">Ссылка</th>
                    <th className="px-3 py-2 text-left">Дедлайн</th>
                    <th className="px-3 py-2 text-center">Приоритет</th>
                    <th className="px-3 py-2 text-center">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employee.tasks.map((task, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-900">{task.description}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          task.type === 'contract' ? 'bg-blue-100 text-blue-800' :
                          task.type === 'logistics' ? 'bg-orange-100 text-orange-800' :
                          task.type === 'warehouse' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.type === 'contract' ? 'Контракт' :
                           task.type === 'logistics' ? 'Логистика' :
                           task.type === 'warehouse' ? 'Склад' : 'Внутренняя'}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{task.reference_id}</td>
                      <td className="px-3 py-2 text-xs">{task.deadline}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          task.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.priority === 'critical' ? 'Критический' :
                           task.priority === 'high' ? 'Высокий' :
                           task.priority === 'medium' ? 'Средний' : 'Низкий'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.status === 'completed' ? 'Завершено' :
                           task.status === 'in_progress' ? 'В работе' : 'Просрочено'}
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

      {activeTab === 'incidents' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Инциденты и достижения</h4>
          {employee.incidents.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">Инциденты не зарегистрированы</div>
          ) : (
            <div className="space-y-2">
              {employee.incidents.map((incident, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  incident.type === 'positive' ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    incident.type === 'positive' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {incident.type === 'positive' ? <Award size={14} /> : <AlertTriangle size={14} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">{incident.date}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        incident.type === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {incident.type === 'positive' ? '✅ Достижение' : '⚠️ Инцидент'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900">{incident.description}</div>
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