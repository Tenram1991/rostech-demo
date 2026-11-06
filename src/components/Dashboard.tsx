import React, { useState, useEffect } from 'react';
import { 
  Home, FileText, Activity, Truck, Warehouse, Users, DollarSign, 
  Shield, Target, Factory, Microscope, Handshake, Landmark, Telescope,
  ChevronDown
} from 'lucide-react';
import { 
  IncomeContractsResponse, ExecutionResponse, LogisticsResponse, 
  WarehouseResponse, EfficiencyResponse, FinanceResponse, 
  RisksResponse, GOZResponse,
  ProductionResponse, QCResponse, SupplierResponse,
  TreasuryResponse, TenderResponse
} from '../types';
import { 
  MOCK_INCOME_CONTRACTS, MOCK_EXECUTION, MOCK_LOGISTICS, 
  MOCK_WAREHOUSE, MOCK_EFFICIENCY, MOCK_FINANCE, 
  MOCK_RISKS, MOCK_GOZ,
  MOCK_PRODUCTION, MOCK_QC, MOCK_SUPPLIERS,
  MOCK_TREASURY, MOCK_TENDERS
} from '../data/mockData';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { IncomeContractsDomain } from './IncomeContractsDomain';
import { ExecutionDomain } from './ExecutionDomain';
import { LogisticsDomain } from './LogisticsDomain';
import { WarehouseDomain } from './WarehouseDomain';
import { EfficiencyDomain } from './EfficiencyDomain';
import { FinanceDomain } from './FinanceDomain';
import { RisksDomain } from './RisksDomain';
import { GOZExecutionDomain } from './GOZExecutionDomain';
import { ProductionDomain } from './ProductionDomain';
import { QCDomain } from './QCDomain';
import { SupplierDomain } from './SupplierDomain';
import { TreasuryDomain } from './TreasuryDomain';
import { TenderDomain } from './TenderDomain';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

type Module = 'operations' | 'finance' | 'coop' | 'strategy';
type Domain = 'home' | 'income' | 'execution' | 'logistics' | 'warehouse' | 'production' | 'efficiency' | 'finance' | 'qc' | 'treasury' | 'supplier' | 'risks' | 'goz' | 'tender';

interface ModuleConfig {
  id: Module;
  label: string;
  icon: React.ReactNode;
  domains: Domain[];
}

const MODULES: ModuleConfig[] = [
  { id: 'operations', label: 'Операции', icon: <Activity size={16} />, domains: ['home', 'execution', 'logistics', 'warehouse', 'production'] },
  { id: 'finance', label: 'Финансы', icon: <DollarSign size={16} />, domains: ['finance', 'treasury', 'income'] },
  { id: 'coop', label: 'Кооперация', icon: <Handshake size={16} />, domains: ['supplier', 'qc', 'efficiency'] },
  { id: 'strategy', label: 'Стратегия', icon: <Target size={16} />, domains: ['risks', 'goz', 'tender'] }
];

const TAB_LABELS: Record<Domain, { label: string; icon: React.ReactNode }> = {
  home: { label: 'Главная', icon: <Home size={14} /> },
  income: { label: 'Доходные', icon: <FileText size={14} /> },
  execution: { label: 'Исполнение', icon: <Activity size={14} /> },
  logistics: { label: 'Логистика', icon: <Truck size={14} /> },
  warehouse: { label: 'Склад', icon: <Warehouse size={14} /> },
  production: { label: 'Производство', icon: <Factory size={14} /> },
  efficiency: { label: 'Команда', icon: <Users size={14} /> },
  finance: { label: 'Финансы', icon: <DollarSign size={14} /> },
  qc: { label: 'ВП и ОТК', icon: <Microscope size={14} /> },
  treasury: { label: 'Казначейство', icon: <Landmark size={14} /> },
  supplier: { label: 'Кооперация', icon: <Handshake size={14} /> },
  risks: { label: 'Риски', icon: <Shield size={14} /> },
  goz: { label: 'Исполнение ГОЗ', icon: <Target size={14} /> },
  tender: { label: 'Тендеры', icon: <Telescope size={14} /> }
};

export const Dashboard: React.FC = () => {
  const [activeModule, setActiveModule] = useState<Module>('operations');
  const [activeDomain, setActiveDomain] = useState<Domain>('home');
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const navigateToFinance = () => { setActiveModule('finance'); setActiveDomain('finance'); };
  const navigateToExecution = () => { setActiveModule('operations'); setActiveDomain('execution'); };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoints = [
          ['income', `${API_BASE}/income-contracts`],
          ['execution', `${API_BASE}/execution/overview`],
          ['logistics', `${API_BASE}/logistics/overview`],
          ['warehouse', `${API_BASE}/warehouse/overview`],
          ['efficiency', `${API_BASE}/efficiency/overview`],
          ['finance', `${API_BASE}/finance/overview`],
          ['risks', `${API_BASE}/risks/overview`],
          ['goz', `${API_BASE}/goz/overview`],
          ['production', `${API_BASE}/production/overview`],
          ['qc', `${API_BASE}/qc/overview`],
          ['supplier', `${API_BASE}/supplier/overview`],
          ['treasury', `${API_BASE}/treasury/overview`],
          ['tender', `${API_BASE}/tender/overview`]
        ];
        
        const results = await Promise.all(
          endpoints.map(async ([key, url]) => {
            try {
              const res = await fetch(url);
              if (res.ok) return { key, data: await res.json(), ok: true };
            } catch (e) { 
              // Игнорируем ошибки сети, сработает фоллбэк на моки
            }
            return { key, data: null, ok: false };
          })
        );

        const allOk = results.every(r => r.ok);
        
        if (allOk) {
          const resultData: Record<string, any> = {};
          results.forEach(r => { 
            if (r.ok && r.data) resultData[r.key] = r.data; 
          });
          setData(resultData);
        } else {
          setData({
            income: MOCK_INCOME_CONTRACTS, execution: MOCK_EXECUTION, logistics: MOCK_LOGISTICS,
            warehouse: MOCK_WAREHOUSE, efficiency: MOCK_EFFICIENCY, finance: MOCK_FINANCE,
            risks: MOCK_RISKS, goz: MOCK_GOZ, production: MOCK_PRODUCTION,
            qc: MOCK_QC, supplier: MOCK_SUPPLIERS, treasury: MOCK_TREASURY, tender: MOCK_TENDERS
          });
        }
      } catch (e) {
        // Полный фоллбэк на моки при любой критической ошибке
        setData({
          income: MOCK_INCOME_CONTRACTS, execution: MOCK_EXECUTION, logistics: MOCK_LOGISTICS,
          warehouse: MOCK_WAREHOUSE, efficiency: MOCK_EFFICIENCY, finance: MOCK_FINANCE,
          risks: MOCK_RISKS, goz: MOCK_GOZ, production: MOCK_PRODUCTION,
          qc: MOCK_QC, supplier: MOCK_SUPPLIERS, treasury: MOCK_TREASURY, tender: MOCK_TENDERS
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-rostech-blue">Загрузка аналитического слоя...</div>;
  if (Object.keys(data).length === 0) return <div className="flex items-center justify-center h-screen text-red-600">Ошибка загрузки данных</div>;

  const currentModule = MODULES.find(m => m.id === activeModule)!;
  const visibleDomains = currentModule.domains;

  const handleModuleChange = (module: Module) => {
    setActiveModule(module);
    const mod = MODULES.find(m => m.id === module)!;
    setActiveDomain(mod.domains[0]);
  };

  const renderDomain = () => {
    switch (activeDomain) {
      case 'home': return <ExecutiveDashboard incomeData={data.income} executionData={data.execution} logisticsData={data.logistics} warehouseData={data.warehouse} efficiencyData={data.efficiency} financeData={data.finance} risksData={data.risks} gozData={data.goz} onNavigateTo={(d) => { const mod = MODULES.find(m => m.domains.includes(d as Domain)); if (mod) { setActiveModule(mod.id); setActiveDomain(d as Domain); } }} />;
      case 'income': return <IncomeContractsDomain data={data.income} />;
      case 'execution': return <ExecutionDomain data={data.execution} onNavigateToFinance={navigateToFinance} />;
      case 'logistics': return <LogisticsDomain data={data.logistics} />;
      case 'warehouse': return <WarehouseDomain data={data.warehouse} />;
      case 'production': return <ProductionDomain data={data.production} />;
      case 'efficiency': return <EfficiencyDomain data={data.efficiency} />;
      case 'finance': return <FinanceDomain data={data.finance} onNavigateToExecution={navigateToExecution} />;
      case 'qc': return <QCDomain data={data.qc} />;
      case 'treasury': return <TreasuryDomain data={data.treasury} />;
      case 'supplier': return <SupplierDomain data={data.supplier} />;
      case 'risks': return <RisksDomain data={data.risks} />;
      case 'goz': return <GOZExecutionDomain data={data.goz} />;
      case 'tender': return <TenderDomain data={data.tender} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управленческий дашборд закупок</h1>
          <p className="text-gray-500 mt-1">Аналитическая надстройка над АС ФЗД | ЕПОЗ | ЕНС</p>
        </div>
      </div>

      {/* УРОВЕНЬ 1: Модули */}
      <div className="flex flex-wrap gap-2 mb-2 border-b border-gray-200">
        {MODULES.map(mod => (
          <button
            key={mod.id}
            onClick={() => handleModuleChange(mod.id)}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold transition-colors border-b-2 ${
              activeModule === mod.id
                ? 'border-rostech-blue text-rostech-blue bg-blue-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {mod.icon}{mod.label}
          </button>
        ))}
      </div>

      {/* УРОВЕНЬ 2: Вкладки внутри модуля */}
      <div className="flex flex-wrap gap-1 mb-6 bg-gray-50 rounded-lg p-1.5">
        {visibleDomains.map(domain => {
          const tab = TAB_LABELS[domain];
          return (
            <button
              key={domain}
              onClick={() => setActiveDomain(domain)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeDomain === domain
                  ? 'bg-white text-rostech-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          );
        })}
      </div>

      {renderDomain()}
    </div>
  );
};