import React, { useState, useEffect } from 'react';
import { Home, FileText, Activity, Truck, Warehouse, Users, DollarSign, Shield, Target } from 'lucide-react';
import { IncomeContractsResponse, ExecutionResponse, LogisticsResponse, WarehouseResponse, EfficiencyResponse, FinanceResponse, RisksResponse, GOZResponse } from '../types';
import { MOCK_INCOME_CONTRACTS, MOCK_EXECUTION, MOCK_LOGISTICS, MOCK_WAREHOUSE, MOCK_EFFICIENCY, MOCK_FINANCE, MOCK_RISKS, MOCK_GOZ } from '../data/mockData';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { IncomeContractsDomain } from './IncomeContractsDomain';
import { ExecutionDomain } from './ExecutionDomain';
import { LogisticsDomain } from './LogisticsDomain';
import { WarehouseDomain } from './WarehouseDomain';
import { EfficiencyDomain } from './EfficiencyDomain';
import { FinanceDomain } from './FinanceDomain';
import { RisksDomain } from './RisksDomain';
import { GOZExecutionDomain } from './GOZExecutionDomain';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

type Domain = 'home' | 'income' | 'execution' | 'logistics' | 'warehouse' | 'efficiency' | 'finance' | 'risks' | 'goz';

export const Dashboard: React.FC = () => {
  const [activeDomain, setActiveDomain] = useState<Domain>('home');
  const [incomeContractsData, setIncomeContractsData] = useState<IncomeContractsResponse | null>(null);
  const [executionData, setExecutionData] = useState<ExecutionResponse | null>(null);
  const [logisticsData, setLogisticsData] = useState<LogisticsResponse | null>(null);
  const [warehouseData, setWarehouseData] = useState<WarehouseResponse | null>(null);
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyResponse | null>(null);
  const [financeData, setFinanceData] = useState<FinanceResponse | null>(null);
  const [risksData, setRisksData] = useState<RisksResponse | null>(null);
  const [gozData, setGozData] = useState<GOZResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const navigateToFinance = () => setActiveDomain('finance');
  const navigateToExecution = () => setActiveDomain('execution');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [incomeRes, executionRes, logisticsRes, warehouseRes, efficiencyRes, financeRes, risksRes, gozRes] = await Promise.all([
          fetch(`${API_BASE}/income-contracts`),
          fetch(`${API_BASE}/execution/overview`),
          fetch(`${API_BASE}/logistics/overview`),
          fetch(`${API_BASE}/warehouse/overview`),
          fetch(`${API_BASE}/efficiency/overview`),
          fetch(`${API_BASE}/finance/overview`),
          fetch(`${API_BASE}/risks/overview`),
          fetch(`${API_BASE}/goz/overview`)
        ]);

        if (incomeRes.ok && executionRes.ok && logisticsRes.ok && warehouseRes.ok && efficiencyRes.ok && financeRes.ok && risksRes.ok && gozRes.ok) {
          setIncomeContractsData(await incomeRes.json());
          setExecutionData(await executionRes.json());
          setLogisticsData(await logisticsRes.json());
          setWarehouseData(await warehouseRes.json());
          setEfficiencyData(await efficiencyRes.json());
          setFinanceData(await financeRes.json());
          setRisksData(await risksRes.json());
          setGozData(await gozRes.json());
        } else {
          console.log('Backend недоступен, используем mock-данные');
          setIncomeContractsData(MOCK_INCOME_CONTRACTS);
          setExecutionData(MOCK_EXECUTION);
          setLogisticsData(MOCK_LOGISTICS);
          setWarehouseData(MOCK_WAREHOUSE);
          setEfficiencyData(MOCK_EFFICIENCY);
          setFinanceData(MOCK_FINANCE);
          setRisksData(MOCK_RISKS);
          setGozData(MOCK_GOZ);
        }
      } catch (e) {
        console.log('Ошибка подключения к backend, используем mock-данные', e);
        setIncomeContractsData(MOCK_INCOME_CONTRACTS);
        setExecutionData(MOCK_EXECUTION);
        setLogisticsData(MOCK_LOGISTICS);
        setWarehouseData(MOCK_WAREHOUSE);
        setEfficiencyData(MOCK_EFFICIENCY);
        setFinanceData(MOCK_FINANCE);
        setRisksData(MOCK_RISKS);
        setGozData(MOCK_GOZ);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-rostech-blue">Загрузка аналитического слоя...</div>;
  if (!incomeContractsData || !executionData || !logisticsData || !warehouseData || !efficiencyData || !financeData || !risksData || !gozData) {
    return <div className="flex items-center justify-center h-screen text-red-600">Ошибка загрузки данных</div>;
  }

  const tabs = [
    { id: 'home' as Domain, icon: <Home size={18} />, label: 'Главная' },
    { id: 'income' as Domain, icon: <FileText size={18} />, label: 'Доходные' },
    { id: 'execution' as Domain, icon: <Activity size={18} />, label: 'Исполнение' },
    { id: 'logistics' as Domain, icon: <Truck size={18} />, label: 'Логистика' },
    { id: 'warehouse' as Domain, icon: <Warehouse size={18} />, label: 'Склад' },
    { id: 'efficiency' as Domain, icon: <Users size={18} />, label: 'Команда' },
    { id: 'finance' as Domain, icon: <DollarSign size={18} />, label: 'Финансы' },
    { id: 'risks' as Domain, icon: <Shield size={18} />, label: 'Риски' },
    { id: 'goz' as Domain, icon: <Target size={18} />, label: 'ГОЗ' }
  ];

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управленческий дашборд закупок</h1>
          <p className="text-gray-500 mt-1">Аналитическая надстройка над АС ФЗД | ЕПОЗ | ЕНС</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveDomain(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeDomain === tab.id
                ? 'border-rostech-blue text-rostech-blue'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeDomain === 'home' && (
        <ExecutiveDashboard
          incomeData={incomeContractsData}
          executionData={executionData}
          logisticsData={logisticsData}
          warehouseData={warehouseData}
          efficiencyData={efficiencyData}
          financeData={financeData}
          risksData={risksData}
          gozData={gozData}
          onNavigateTo={(domain) => setActiveDomain(domain as Domain)}
        />
      )}
      {activeDomain === 'income' && <IncomeContractsDomain data={incomeContractsData} />}
      {activeDomain === 'execution' && <ExecutionDomain data={executionData} onNavigateToFinance={navigateToFinance} />}
      {activeDomain === 'logistics' && <LogisticsDomain data={logisticsData} />}
      {activeDomain === 'warehouse' && <WarehouseDomain data={warehouseData} />}
      {activeDomain === 'efficiency' && <EfficiencyDomain data={efficiencyData} />}
      {activeDomain === 'finance' && <FinanceDomain data={financeData} onNavigateToExecution={navigateToExecution} />}
      {activeDomain === 'risks' && <RisksDomain data={risksData} />}
      {activeDomain === 'goz' && <GOZExecutionDomain data={gozData} />}
    </div>
  );
};