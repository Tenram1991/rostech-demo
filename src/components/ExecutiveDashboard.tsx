import React from 'react';
import { 
  AlertTriangle, TrendingUp, DollarSign, Package, Users, Shield, 
  Target, Truck, Activity, Bell, CheckCircle, XCircle, Clock,
  ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import { 
  IncomeContractsResponse, ExecutionResponse, LogisticsResponse, 
  WarehouseResponse, EfficiencyResponse, FinanceResponse, RisksResponse, GOZResponse 
} from '../types';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

interface ExecutiveDashboardProps {
  incomeData: IncomeContractsResponse;
  executionData: ExecutionResponse;
  logisticsData: LogisticsResponse;
  warehouseData: WarehouseResponse;
  efficiencyData: EfficiencyResponse;
  financeData: FinanceResponse;
  risksData: RisksResponse;
  gozData: GOZResponse;
  onNavigateTo: (domain: string) => void;
}

interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  description: string;
  source: string;
  navigateTo: string;
  timestamp: string;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  incomeData, executionData, logisticsData, warehouseData,
  efficiencyData, financeData, risksData, gozData, onNavigateTo
}) => {
  // Генерация алертов на основе данных из всех вкладок
  const alerts: Alert[] = [];

  // Критические риски
  risksData.risks
    .filter(r => r.severity === 'critical' && r.status !== 'closed')
    .forEach(r => {
      alerts.push({
        id: r.id,
        severity: 'critical',
        title: `Критический риск: ${r.description}`,
        description: `${r.linked_object} | Ответственный: ${r.responsible} | ${r.days_open} дн.`,
        source: 'Сводные риски',
        navigateTo: 'risks',
        timestamp: r.detection_date
      });
    });

  // Кассовые разрывы
  financeData.cash_flow
    .filter(cf => cf.cash_gap && cf.period_type === 'month')
    .forEach(cf => {
      alerts.push({
        id: `cash-gap-${cf.period}`,
        severity: 'critical',
        title: `Кассовый разрыв: ${cf.period}`,
        description: `Сальдо: ${formatCurrency(cf.balance)} | План поступлений: ${formatCurrency(cf.planned_inbound)}`,
        source: 'Финансы',
        navigateTo: 'finance',
        timestamp: cf.period
      });
    });

  // Просроченные ИГК
  gozData.items
    .filter(i => i.status === 'overdue')
    .forEach(i => {
      alerts.push({
        id: i.id,
        severity: 'critical',
        title: `Просрочен ИГК: ${i.subject}`,
        description: `${i.contract_number} | Просрочено на ${Math.abs(i.days_remaining)} дн.`,
        source: 'Исполнение ГОЗ',
        navigateTo: 'goz',
        timestamp: i.planned_end_date
      });
    });

  // Задержки в логистике
  logisticsData.shipments
    .filter(s => s.status === 'delayed')
    .forEach(s => {
      alerts.push({
        id: s.id,
        severity: 'high',
        title: `Задержка рейса: ${s.shipment_number}`,
        description: `${s.cargo_name} | ${s.route_from} → ${s.route_to} | +${s.deviation_days} дн.`,
        source: 'Логистика',
        navigateTo: 'logistics',
        timestamp: s.planned_delivery
      });
    });

  // Дефицит на складе
  warehouseData.items
    .filter(i => i.status === 'deficit')
    .forEach(i => {
      alerts.push({
        id: i.id,
        severity: 'high',
        title: `Дефицит ТМЦ: ${i.name}`,
        description: `Остаток: ${i.current_stock} ${i.unit} | Мин: ${i.min_stock}`,
        source: 'Склад',
        navigateTo: 'warehouse',
        timestamp: i.last_receipt_date || '—'
      });
    });

  // Просроченное обучение
  efficiencyData.employees
    .filter(e => e.training_status === 'expired')
    .forEach(e => {
      alerts.push({
        id: e.id,
        severity: 'high',
        title: `Просрочено обучение: ${e.name}`,
        description: `${e.position} | Истекало: ${e.training_expiry_date}`,
        source: 'Эффективность',
        navigateTo: 'efficiency',
        timestamp: e.training_expiry_date || '—'
      });
    });

  // Сортировка алертов по серьезности
  const severityOrder = { critical: 0, high: 1, medium: 2, info: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="text-red-600" size={20} />;
      case 'high': return <AlertTriangle className="text-orange-600" size={20} />;
      case 'medium': return <Bell className="text-yellow-600" size={20} />;
      default: return <Bell className="text-blue-600" size={20} />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'high': return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
      case 'medium': return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default: return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    }
  };

  return (
    <div>
      {/* Заголовок с датой */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Сводка по состоянию закупок</h2>
            <p className="text-gray-500 mt-1">Актуально на 04.11.2026 | Все направления</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <Bell className="text-blue-600" size={20} />
            <span className="text-sm font-medium text-blue-900">
              {alerts.length} активных уведомлений
            </span>
          </div>
        </div>
      </div>

      {/* Ключевые метрики по всем направлениям */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div 
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateTo('finance')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">💰 Финансы</span>
            <DollarSign className="text-blue-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {((financeData.summary.total_received / financeData.summary.total_income_amount) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {formatCurrency(financeData.summary.total_received)} из {formatCurrency(financeData.summary.total_income_amount)}
          </div>
          {financeData.summary.cash_gap_amount > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-700 font-medium">
              <AlertTriangle size={12} />
              <span>Кассовый разрыв: {formatCurrency(financeData.summary.cash_gap_amount)}</span>
            </div>
          )}
        </div>

        <div 
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateTo('execution')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">📋 Контракты</span>
            <Activity className="text-green-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {executionData.expense_contracts.filter(c => 
              c.execution_status === 'completed' || c.execution_status === 'delivered' || c.execution_status === 'accepted'
            ).length} / {executionData.summary.total_expense_contracts}
          </div>
          <div className="text-xs text-gray-500 mb-2">исполнено договоров</div>
          {executionData.summary.overdue_contracts > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-700 font-medium">
              <AlertTriangle size={12} />
              <span>{executionData.summary.overdue_contracts} просрочено</span>
            </div>
          )}
        </div>

        <div 
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateTo('logistics')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">🚚 Логистика</span>
            <Truck className="text-purple-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {logisticsData.shipments.filter(s => s.status !== 'delayed').length} / {logisticsData.summary.total_shipments}
          </div>
          <div className="text-xs text-gray-500 mb-2">рейсов в срок</div>
          {logisticsData.shipments.filter(s => s.status === 'delayed').length > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-700 font-medium">
              <AlertTriangle size={12} />
              <span>{logisticsData.shipments.filter(s => s.status === 'delayed').length} задержек</span>
            </div>
          )}
        </div>

        <div 
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateTo('warehouse')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">📦 Склад</span>
            <Package className="text-indigo-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {warehouseData.summary.total_positions}
          </div>
          <div className="text-xs text-gray-500 mb-2">позиций ТМЦ</div>
          {warehouseData.summary.deficit_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-700 font-medium">
              <AlertTriangle size={12} />
              <span>{warehouseData.summary.deficit_count} дефицитов</span>
            </div>
          )}
        </div>

        <div 
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateTo('efficiency')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">👥 Команда</span>
            <Users className="text-pink-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {efficiencyData.summary.total_employees}
          </div>
          <div className="text-xs text-gray-500 mb-2">сотрудников</div>
          {efficiencyData.summary.employees_at_risk > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-700 font-medium">
              <AlertTriangle size={12} />
              <span>{efficiencyData.summary.employees_at_risk} в зоне риска</span>
            </div>
          )}
        </div>

        <div 
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateTo('risks')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">⚠️ Риски</span>
            <Shield className="text-red-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {risksData.summary.critical_count}
          </div>
          <div className="text-xs text-gray-500 mb-2">критических рисков</div>
          {risksData.summary.open_count > 5 && (
            <div className="flex items-center gap-1 text-xs text-red-700 font-medium">
              <AlertTriangle size={12} />
              <span>{risksData.summary.open_count} открытых</span>
            </div>
          )}
        </div>

        <div 
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateTo('goz')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">🎖️ ГОЗ</span>
            <Target className="text-yellow-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {gozData.summary.completed_on_time} / {gozData.summary.total_igk}
          </div>
          <div className="text-xs text-gray-500 mb-2">ИГК завершено</div>
          {gozData.summary.overdue > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-700 font-medium">
              <AlertTriangle size={12} />
              <span>{gozData.summary.overdue} просрочено/риск</span>
            </div>
          )}
        </div>

        <div 
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigateTo('income')}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">📄 Доходные</span>
            <TrendingUp className="text-teal-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {incomeData.summary.total_contracts}
          </div>
          <div className="text-xs text-gray-500 mb-2">контрактов</div>
          <div className="text-xs text-gray-700 font-medium">
            {formatCurrency(incomeData.summary.total_amount)}
          </div>
        </div>
      </div>

      {/* Центр уведомлений */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Zap className="text-red-600" size={20} />
            Требуют внимания прямо сейчас
          </h3>
        </div>
        <div className="p-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={48} />
              <p className="text-lg font-medium">Все системы в норме</p>
              <p className="text-sm">Критических событий не обнаружено</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${getAlertColor(alert.severity)}`}
                  onClick={() => onNavigateTo(alert.navigateTo)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{alert.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.source}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">{alert.description}</div>
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-500">
                    {alert.timestamp}
                  </div>
                </div>
              ))}
              {alerts.length > 10 && (
                <div className="text-center pt-2">
                  <button 
                    onClick={() => onNavigateTo('risks')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Показать все {alerts.length} уведомлений →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Быстрый переход</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => onNavigateTo('finance')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
          >
            <DollarSign className="text-blue-600 mb-2" size={24} />
            <div className="text-sm font-medium text-gray-900">Финансы</div>
            <div className="text-xs text-gray-500">Платежи и счета</div>
          </button>
          <button 
            onClick={() => onNavigateTo('risks')}
            className="p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"
          >
            <Shield className="text-red-600 mb-2" size={24} />
            <div className="text-sm font-medium text-gray-900">Риски</div>
            <div className="text-xs text-gray-500">{risksData.summary.critical_count} критических</div>
          </button>
          <button 
            onClick={() => onNavigateTo('goz')}
            className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left"
          >
            <Target className="text-yellow-600 mb-2" size={24} />
            <div className="text-sm font-medium text-gray-900">ГОЗ</div>
            <div className="text-xs text-gray-500">{gozData.summary.total_igk} ИГК</div>
          </button>
          <button 
            onClick={() => onNavigateTo('logistics')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
          >
            <Truck className="text-purple-600 mb-2" size={24} />
            <div className="text-sm font-medium text-gray-900">Логистика</div>
            <div className="text-xs text-gray-500">{logisticsData.summary.total_shipments} рейсов</div>
          </button>
        </div>
      </div>
    </div>
  );
};