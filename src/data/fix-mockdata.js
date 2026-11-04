const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'mockData.ts');

// Читаем текущий файл
let content = fs.readFileSync(filePath, 'utf8');

// 1. Исправляем импорты в первой строке
const correctImports = `import { IncomeContractsResponse, ExecutionResponse, LogisticsResponse, LogisticsShipment, ExpenseContract, ExecutionRisk } from '../types';`;

// Заменяем первую строку импортов (любую вариацию)
content = content.replace(/^import\s+\{[^}]+\}\s+from\s+['"]\.\.\/types['"];?/m, correctImports);

// 2. Проверяем, есть ли MOCK_LOGISTICS_SHIPMENTS
if (!content.includes('const MOCK_LOGISTICS_SHIPMENTS: LogisticsShipment[]')) {
  console.log('Добавляем MOCK_LOGISTICS_SHIPMENTS...');
  
  const logisticsData = `
const MOCK_LOGISTICS_SHIPMENTS: LogisticsShipment[] = [
  { id: "LS-001", shipment_number: "ЛГ-2026-0145", income_contract_id: "IC-001", igk_code: "8503000000000000001", expense_contract_id: "EC-001", direction: "inbound", transport_type: "own_auto", carrier_name: "Собственный автопарк", route_from: "г. Челябинск, ООО 'Двигатель-М'", route_to: "г. Омск, Завод №175", distance_km: 1800, cargo_name: "Двигатель УТД-32", weight_tons: 2.5, volume_m3: 8, cost: 180000, contract_amount: 18000000, cost_percent: 1.0, planned_departure: "2026-06-25", actual_departure: "2026-06-25", planned_delivery: "2026-06-30", actual_delivery: null, deviation_days: 0, status: "in_transit", sla_percent: null, ttn_number: "ТТН-2026-08945", responsible_logist: "Новикова Е.А.", risks: [], waypoints: [{ name: "Отгрузка", planned_time: "2026-06-25 08:00", actual_time: "2026-06-25 08:15", status: "completed" }, { name: "В пути", planned_time: "2026-06-27 12:00", actual_time: null, status: "in_progress" }, { name: "Прибытие", planned_time: "2026-06-30 18:00", actual_time: null, status: "pending" }], documents: ["ТТН-2026-08945.pdf", "Путевой лист №445.pdf"], special_permit: "СП-2026-0145", armed_escort: false, military_acceptance: true, separate_account: "40602810100000099999" },
  { id: "LS-002", shipment_number: "ЛГ-2026-0146", income_contract_id: "IC-001", igk_code: "8503000000000000001", expense_contract_id: "EC-003", direction: "inbound", transport_type: "own_rail", carrier_name: "Собственный ЖД-тупик", route_from: "г. Магнитогорск, ПАО 'Металлург'", route_to: "г. Омск, Завод №175", distance_km: 950, cargo_name: "Броневая сталь", weight_tons: 45, volume_m3: 60, cost: 420000, contract_amount: 8500000, cost_percent: 4.9, planned_departure: "2026-02-20", actual_departure: "2026-02-20", planned_delivery: "2026-02-28", actual_delivery: "2026-02-28", deviation_days: 0, status: "delivered", sla_percent: 100, ttn_number: "ЖД-2026-01234", responsible_logist: "Новикова Е.А.", risks: [], waypoints: [{ name: "Отгрузка", planned_time: "2026-02-20 10:00", actual_time: "2026-02-20 10:00", status: "completed" }, { name: "Прибытие", planned_time: "2026-02-28 14:00", actual_time: "2026-02-28 12:30", status: "completed" }], documents: ["ЖД-накладная №01234.pdf"], special_permit: "СП-2026-0146", armed_escort: false, military_acceptance: true, separate_account: "40602810100000099999" },
  { id: "LS-003", shipment_number: "ЛГ-2026-0201", income_contract_id: "IC-001", igk_code: "8503000000000000001", expense_contract_id: null, direction: "outbound", transport_type: "tk_auto", carrier_name: "ООО 'ТрансЛогистик'", route_from: "г. Омск, Завод №175", route_to: "г. Кубинка, полигон МО РФ", distance_km: 2800, cargo_name: "БМП-3 (готовая)", weight_tons: 18, volume_m3: 45, cost: 280000, contract_amount: 120000000, cost_percent: 0.23, planned_departure: "2026-12-20", actual_departure: null, planned_delivery: "2026-12-28", actual_delivery: null, deviation_days: 0, status: "planned", sla_percent: 94, ttn_number: "—", responsible_logist: "Новикова Е.А.", risks: [], waypoints: [{ name: "Отгрузка", planned_time: "2026-12-20 06:00", actual_time: null, status: "pending" }, { name: "Прибытие", planned_time: "2026-12-28 18:00", actual_time: null, status: "pending" }], documents: [], special_permit: "СП-2026-0201", armed_escort: true, military_acceptance: true, separate_account: "40602810100000099999" },
  { id: "LS-004", shipment_number: "ЛГ-2026-0147", income_contract_id: "IC-001", igk_code: "8503000000000000001", expense_contract_id: "EC-002", direction: "inbound", transport_type: "tk_auto", carrier_name: "РТ-Логистика", route_from: "г. Новосибирск, АО 'Оптика-Прибор'", route_to: "г. Омск, Завод №175", distance_km: 650, cargo_name: "Прицельный комплекс", weight_tons: 0.8, volume_m3: 3, cost: 95000, contract_amount: 12000000, cost_percent: 0.79, planned_departure: "2026-07-10", actual_departure: null, planned_delivery: "2026-07-15", actual_delivery: null, deviation_days: 0, status: "planned", sla_percent: 96, ttn_number: "—", responsible_logist: "Новикова Е.А.", risks: [], waypoints: [{ name: "Отгрузка", planned_time: "2026-07-10 09:00", actual_time: null, status: "pending" }], documents: [], special_permit: "СП-2026-0147", armed_escort: false, military_acceptance: true, separate_account: "40602810100000099999" }
];

export const MOCK_LOGISTICS: LogisticsResponse = {
  shipments: MOCK_LOGISTICS_SHIPMENTS,
  carriers: ["Собственный автопарк", "Собственный ЖД-тупик", "ООО 'ТрансЛогистик'", "РТ-Логистика"],
  summary: {
    total_shipments: MOCK_LOGISTICS_SHIPMENTS.length,
    own_transport_percent: 0,
    total_cost: MOCK_LOGISTICS_SHIPMENTS.reduce((sum: number, s: LogisticsShipment) => sum + s.cost, 0),
    avg_deviation_days: 0,
    avg_sla_percent: 0,
    risk_shipments: MOCK_LOGISTICS_SHIPMENTS.filter((s: LogisticsShipment) => s.risks.length > 0).length,
    inbound_count: MOCK_LOGISTICS_SHIPMENTS.filter((s: LogisticsShipment) => s.direction === 'inbound').length,
    outbound_count: MOCK_LOGISTICS_SHIPMENTS.filter((s: LogisticsShipment) => s.direction === 'outbound').length,
    own_auto_count: MOCK_LOGISTICS_SHIPMENTS.filter((s: LogisticsShipment) => s.transport_type === 'own_auto').length,
    own_rail_count: MOCK_LOGISTICS_SHIPMENTS.filter((s: LogisticsShipment) => s.transport_type === 'own_rail').length,
    tk_auto_count: MOCK_LOGISTICS_SHIPMENTS.filter((s: LogisticsShipment) => s.transport_type === 'tk_auto').length,
    tk_rail_count: MOCK_LOGISTICS_SHIPMENTS.filter((s: LogisticsShipment) => s.transport_type === 'tk_rail').length,
    tk_air_count: MOCK_LOGISTICS_SHIPMENTS.filter((s: LogisticsShipment) => s.transport_type === 'tk_air').length
  }
};

const ownCount = MOCK_LOGISTICS.summary.own_auto_count + MOCK_LOGISTICS.summary.own_rail_count;
MOCK_LOGISTICS.summary.own_transport_percent = (ownCount / MOCK_LOGISTICS.summary.total_shipments * 100);
const tkShipments = MOCK_LOGISTICS_SHIPMENTS.filter((s: LogisticsShipment) => s.sla_percent !== null);
MOCK_LOGISTICS.summary.avg_sla_percent = tkShipments.length > 0 ? (tkShipments.reduce((sum: number, s: LogisticsShipment) => sum + (s.sla_percent || 0), 0) / tkShipments.length) : 0;
const deviatedShipments = MOCK_LOGISTICS_SHIPMENTS.filter((s: LogisticsShipment) => s.actual_delivery !== null);
MOCK_LOGISTICS.summary.avg_deviation_days = deviatedShipments.length > 0 ? (deviatedShipments.reduce((sum: number, s: LogisticsShipment) => sum + s.deviation_days, 0) / deviatedShipments.length) : 0;
`;
  
  content += logisticsData;
}

// 3. Записываем файл с UTF-8 BOM
const BOM = '\uFEFF';
fs.writeFileSync(filePath, BOM + content, 'utf8');

console.log('Файл mockData.ts успешно исправлен!');
console.log('Проверьте импорты и наличие MOCK_LOGISTICS_SHIPMENTS');