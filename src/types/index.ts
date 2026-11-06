// ==================== ОБЩИЕ ТИПЫ ====================

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RiskStatus = 'open' | 'in_progress' | 'closed' | 'mitigated';
export type Department = 'procurement' | 'coop' | 'warehouse' | 'logistics' | 'legal' | 'finance';

// ==================== ДОХОДНЫЕ ДОГОВОРЫ ====================

export type ContractType = 'goz' | 'commercial';
export type PaymentStatus = 'advance_received' | 'waiting_advance' | 'partial' | 'fully_paid' | 'advance_paid';
export type ExecutionStatus = 'signing' | 'waiting_advance' | 'in_progress' | 'completed' | 'overdue' | 'cancelled' | 'delivered' | 'accepted';

export interface StatusLogEntry {
  date: string;
  status: string;
  user: string;
  comment: string;
}

export interface IncomeContract {
  id: string;
  contract_number: string;
  igk_code: string | null;
  subject: string;
  theme: string;
  customer: string;
  contract_type: ContractType;
  signing_date: string;
  end_date: string;
  days_remaining: number;
  pki_cost: number;
  materials_cost: number;
  logistics_cost: number;
  total_amount: number;
  paid_amount: number;
  payment_percent: number;
  payment_status: PaymentStatus;
  execution_status: ExecutionStatus;
  risks: string[];
  receivable_amount: number;
  bank_name: string;
  bank_account: string;
  corr_account: string;
  bik: string;
  inn_kpp: string;
  okpo: string;
  separate_account: string | null;
  documents: string[];
  status_log: StatusLogEntry[];
}

export interface IncomeContractsSummary {
  total_contracts: number;
  goz_contracts: number;
  commercial_contracts: number;
  total_amount: number;
  total_paid: number;
  payment_percent: number;
  overdue_contracts: number;
  risk_contracts: number;
  total_receivable: number;
}

export interface IncomeContractsResponse {
  contracts: IncomeContract[];
  summary: IncomeContractsSummary;
}

// ==================== ИСПОЛНЕНИЕ КОНТРАКТА ====================

export type ExpenseContractType = 'pki' | 'materials' | 'services' | 'delivery' | 'shipment';
export type ExecutionStageStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'delayed';

export interface ExecutionStage {
  stage_name: string;
  planned_date: string;
  actual_date: string | null;
  deviation_days: number;
  status: ExecutionStageStatus;
}

export interface ExecutionPayment {
  date: string;
  amount: number;
  type: 'advance' | 'intermediate' | 'final';
  status: 'completed' | 'pending';
}

export interface ExpenseContract {
  id: string;
  income_contract_id: string;
  igk_code: string | null;
  theme: string | null;
  contract_number: string;
  type: ExpenseContractType;
  supplier_name: string;
  subject: string;
  amount: number;
  advance_percent: number;
  advance_amount: number;
  paid_amount: number;
  payment_percent: number;
  payment_status: PaymentStatus;
  execution_status: ExecutionStatus;
  planned_delivery_date: string;
  actual_delivery_date: string | null;
  deviation_days: number;
  responsible_employee: string;
  risks: string[];
  documents: string[];
  stages: ExecutionStage[];
  payments: ExecutionPayment[];
}

export interface ExecutionRisk {
  id: string;
  income_contract_id: string;
  expense_contract_id: string;
  supplier_name: string;
  risk_type: string;
  severity: RiskSeverity;
  description: string;
  impact: string;
  action_required: string;
  responsible_employee: string;
  detection_date: string;
  mitigation_status: RiskStatus;
}

export interface ExecutionSummary {
  total_expense_contracts: number;
  total_amount: number;
  total_paid: number;
  payment_percent: number;
  overdue_contracts: number;
  critical_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
}

export interface ExecutionResponse {
  expense_contracts: ExpenseContract[];
  risks: ExecutionRisk[];
  summary: ExecutionSummary;
}

// ==================== ЛОГИСТИКА ====================

export type TransportType = 'own_auto' | 'own_rail' | 'tk_auto' | 'tk_rail' | 'tk_air';
export type ShipmentStatus = 'planned' | 'in_transit' | 'delivered' | 'delayed' | 'customs';
export type WaypointStatus = 'pending' | 'in_progress' | 'completed';

export interface Waypoint {
  name: string;
  planned_time: string;
  actual_time: string | null;
  status: WaypointStatus;
}

export interface LogisticsShipment {
  id: string;
  shipment_number: string;
  income_contract_id: string;
  igk_code: string | null;
  expense_contract_id: string | null;
  direction: 'inbound' | 'outbound';
  transport_type: TransportType;
  carrier_name: string;
  route_from: string;
  route_to: string;
  distance_km: number;
  cargo_name: string;
  weight_tons: number;
  volume_m3: number;
  cost: number;
  contract_amount: number;
  cost_percent: number;
  planned_departure: string;
  actual_departure: string | null;
  planned_delivery: string;
  actual_delivery: string | null;
  deviation_days: number;
  status: ShipmentStatus;
  sla_percent: number | null;
  ttn_number: string;
  responsible_logist: string;
  risks: string[];
  waypoints: Waypoint[];
  documents: string[];
  special_permit?: string | null;
  armed_escort: boolean;
  military_acceptance: boolean;
  separate_account?: string | null;
}

export interface LogisticsSummary {
  total_shipments: number;
  own_transport_percent: number;
  total_cost: number;
  avg_deviation_days: number;
  avg_sla_percent: number;
  risk_shipments: number;
  inbound_count: number;
  outbound_count: number;
  own_auto_count: number;
  own_rail_count: number;
  tk_auto_count: number;
  tk_rail_count: number;
  tk_air_count: number;
}

export interface LogisticsResponse {
  shipments: LogisticsShipment[];
  carriers: string[];
  summary: LogisticsSummary;
}

// ==================== СКЛАД ====================

export type WarehouseCategory = 'pki' | 'materials' | 'finished' | 'auxiliary';
export type WarehouseStatus = 'normal' | 'deficit' | 'surplus' | 'obsolete';
export type MovementType = 'receipt' | 'issue' | 'transfer' | 'inventory' | 'writeoff';
export type MovementStatus = 'completed' | 'draft' | 'cancelled';

export interface WarehouseMovement {
  id: string;
  date: string;
  type: MovementType;
  quantity: number;
  amount: number;
  document_number: string;
  basis: string;
  counterparty: string;
  warehouse_from?: string;
  warehouse_to?: string;
  responsible: string;
  status: MovementStatus;
}

export interface WarehouseItem {
  id: string;
  ens_code: string;
  name: string;
  category: WarehouseCategory;
  unit: string;
  current_stock: number;
  reserved_for_goz: number;
  free_stock: number;
  min_stock: number;
  max_stock: number;
  status: WarehouseStatus;
  unit_cost: number;
  total_cost: number;
  expense_contract_id: string | null;
  igk_code: string | null;
  storage_location: string;
  last_receipt_date: string | null;
  last_issue_date: string | null;
  turnover_days: number;
  responsible: string;
  risks: string[];
  movements: WarehouseMovement[];
}

export interface WarehouseSummary {
  total_positions: number;
  total_value: number;
  goz_reserved_value: number;
  goz_reserved_percent: number;
  deficit_count: number;
  surplus_count: number;
  obsolete_count: number;
  avg_turnover_days: number;
  pki_count: number;
  materials_count: number;
  finished_count: number;
  auxiliary_count: number;
  pki_value: number;
  materials_value: number;
  finished_value: number;
  auxiliary_value: number;
}

export interface WarehouseResponse {
  items: WarehouseItem[];
  summary: WarehouseSummary;
  warehouses: string[];
}

// ==================== ЭФФЕКТИВНОСТЬ ====================

export type WorkloadStatus = 'underloaded' | 'normal' | 'overloaded';
export type TrainingStatus = 'current' | 'expiring' | 'expired';
export type EmployeeRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface EmployeeTask {
  id: string;
  type: 'contract' | 'logistics' | 'warehouse' | 'internal';
  reference_id: string;
  description: string;
  deadline: string;
  status: 'completed' | 'in_progress' | 'overdue';
  completed_date?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: Department;
  is_manager: boolean;
  workload_percent: number;
  workload_status: WorkloadStatus;
  efficiency_sla: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  active_contracts: number;
  risk_amount: number;
  training_status: TrainingStatus;
  training_expiry_date: string | null;
  certifications: string[];
  initiatives: number;
  overall_status: EmployeeRiskLevel;
  tasks: EmployeeTask[];
  incidents: Array<{
    date: string;
    type: 'positive' | 'negative';
    description: string;
  }>;
}

export interface DepartmentSummary {
  department: Department;
  name: string;
  employee_count: number;
  avg_workload: number;
  avg_efficiency: number;
  total_overdue: number;
  critical_risks: number;
  total_managed_amount: number;
  status: EmployeeRiskLevel;
}

export interface EfficiencyResponse {
  employees: Employee[];
  departments: DepartmentSummary[];
  summary: {
    total_employees: number;
    avg_workload: number;
    avg_efficiency: number;
    employees_at_risk: number;
    expired_training: number;
    total_risk_amount: number;
    open_vacancies: number;
  };
}

// ==================== ФИНАНСЫ ====================

export type PaymentDirection = 'inbound' | 'outbound';
export type PaymentType = 'advance' | 'intermediate' | 'final' | 'penalty';
export type FinancePaymentStatus = 'planned' | 'received' | 'sent' | 'overdue' | 'cancelled';
export type AccountStatus = 'normal' | 'deficit' | 'surplus' | 'blocked';
export type CashFlowPeriod = 'month' | 'quarter' | 'halfyear' | 'year';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  type: PaymentType;
  status: FinancePaymentStatus;
  direction: PaymentDirection;
  igk_code: string | null;
  contract_id: string;
  counterparty: string;
  description: string;
  document_number: string;
}

export interface SeparateAccount {
  igk_code: string;
  contract_id: string;
  contract_number: string;
  customer: string;
  total_amount: number;
  received_amount: number;
  received_percent: number;
  remaining_to_receive: number;
  paid_to_suppliers: number;
  account_balance: number;
  limit_usage_percent: number;
  status: AccountStatus;
  bank_name: string;
  account_number: string;
  last_operation_date: string;
  risks: string[];
}

export interface CashFlowItem {
  period: string;
  period_type: CashFlowPeriod;
  planned_inbound: number;
  actual_inbound: number;
  planned_outbound: number;
  actual_outbound: number;
  balance: number;
  cash_gap: boolean;
}

export interface FinanceResponse {
  separate_accounts: SeparateAccount[];
  payments: Payment[];
  cash_flow: CashFlowItem[];
  summary: {
    total_income_amount: number;
    total_received: number;
    total_paid_to_suppliers: number;
    total_account_balance: number;
    cash_gap_amount: number;
    receivable_amount: number;
    avg_payment_delay_days: number;
  };
}

// ==================== СВОДНЫЕ РИСКИ ====================

export type RiskCategory = 'financial' | 'sanction' | 'deadline' | 'document' | 'quality' | 'logistics' | 'compliance' | 'personnel';
export type RiskSource = 'income' | 'execution' | 'logistics' | 'warehouse' | 'efficiency' | 'finance';

export interface ConsolidatedRisk {
  id: string;
  category: RiskCategory;
  description: string;
  source: RiskSource;
  linked_object: string;
  probability: number;
  impact: number;
  risk_level: number;
  severity: RiskSeverity;
  detection_date: string;
  days_open: number;
  responsible: string;
  department: Department;
  required_action: string;
  status: RiskStatus;
  closure_date: string | null;
  mitigation_history: Array<{
    date: string;
    action: string;
    user: string;
    result: string;
  }>;
  related_risks: string[];
}

export interface RiskHeatmapCell {
  category: RiskCategory;
  department: Department;
  count: number;
  critical_count: number;
  high_count: number;
}

export interface RiskTrendItem {
  week: string;
  opened: number;
  closed: number;
  total_open: number;
}

export interface RisksResponse {
  risks: ConsolidatedRisk[];
  heatmap: RiskHeatmapCell[];
  trend: RiskTrendItem[];
  summary: {
    total_risks: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    open_count: number;
    in_progress_count: number;
    closed_count: number;
    mitigated_count: number;
    closed_this_month: number;
    avg_days_open: number;
    top_category: RiskCategory;
    top_department: Department;
  };
}
// ==================== ИСПОЛНЕНИЕ ГОЗ ====================

export type GOZExecutionStatus = 'completed' | 'in_progress' | 'at_risk' | 'overdue' | 'planned';
export type GOZTheme = 'armor' | 'aviation' | 'electronics' | 'medical' | 'it' | 'industrial';

export interface GOZMilestone {
  id: string;
  name: string;
  planned_date: string;
  actual_date: string | null;
  status: 'completed' | 'in_progress' | 'pending' | 'overdue';
  description: string;
}

export interface GOZLinkedObject {
  type: 'expense_contract' | 'logistics' | 'warehouse';
  id: string;
  name: string;
  status: string;
}

export interface GOZItem {
  id: string;
  igk_code: string;
  contract_id: string;
  contract_number: string;
  theme: GOZTheme;
  theme_name: string;
  customer: string;
  subject: string;
  total_amount: number;
  planned_start_date: string;
  planned_end_date: string;
  actual_end_date: string | null;
  days_remaining: number;
  payment_percent: number;
  execution_percent: number;
  expense_contracts_count: number;
  logistics_count: number;
  warehouse_positions_count: number;
  status: GOZExecutionStatus;
  risks_count: number;
  milestones: GOZMilestone[];
  linked_objects: GOZLinkedObject[];
}

export interface GOZThemeSummary {
  theme: GOZTheme;
  theme_name: string;
  igk_count: number;
  total_amount: number;
  avg_execution_percent: number;
  overdue_count: number;
  status: GOZExecutionStatus;
}

export interface GOZSummary {
  total_igk: number;
  completed_on_time: number;
  in_progress: number;
  overdue: number;
  total_amount: number;
  plan_completion_percent: number;
  avg_execution_percent: number;
  total_expense_contracts: number;
  total_logistics: number;
  total_warehouse_positions: number;
}

export interface GOZResponse {
  items: GOZItem[];
  themes: GOZThemeSummary[];
  summary: GOZSummary;
}
// ==================== ПРОИЗВОДСТВЕННЫЙ КОНТУР ====================

export type ShopStatus = 'idle' | 'running' | 'maintenance' | 'breakdown';
export type DowntimeReason = 'no_materials' | 'no_tooling' | 'breakdown' | 'planned' | 'other';

export interface ShopUnit {
  id: string;
  name: string;
  type: 'workshop' | 'line' | 'station';
  status: ShopStatus;
  load_percent: number;
  planned_load: number;
  products: string[];
  current_order: string | null;
  efficiency: number;
  downtime_hours: number;
  downtime_reason: DowntimeReason | null;
}

export interface MaterialNeed {
  id: string;
  shop_id: string;
  shop_name: string;
  item_name: string;
  ens_code: string;
  quantity_needed: number;
  quantity_in_stock: number;
  shortage: number;
  needed_date: string;
  linked_igk: string;
  linked_contract: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface DowntimeEvent {
  id: string;
  shop_id: string;
  shop_name: string;
  start_time: string;
  end_time: string | null;
  duration_hours: number;
  reason: DowntimeReason;
  description: string;
  loss_amount: number;
  linked_igk: string | null;
}

export interface ProductionResponse {
  shops: ShopUnit[];
  material_needs: MaterialNeed[];
  downtimes: DowntimeEvent[];
  summary: {
    total_shops: number;
    running_count: number;
    idle_count: number;
    breakdown_count: number;
    avg_load_percent: number;
    total_downtime_hours: number;
    total_loss_amount: number;
    critical_shortages: number;
    total_material_needs: number;
  };
}

// ==================== ВОЕННАЯ ПРИЁМКА И ОТК ====================

export type VPStatus = 'open' | 'in_progress' | 'resolved' | 'rejected' | 'escalated';
export type QCStage = 'incoming' | 'in_process' | 'final' | 'vp_acceptance' | 'customer_acceptance';
export type DefectType = 'dimensional' | 'material' | 'assembly' | 'documentation' | 'functional';

export interface VPPrescription {
  id: string;
  number: string;
  date: string;
  linked_igk: string;
  linked_contract: string;
  product: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: VPStatus;
  deadline: string;
  responsible: string;
  days_open: number;
  resolution: string | null;
}

export interface QCDefect {
  id: string;
  date: string;
  stage: QCStage;
  product: string;
  defect_type: DefectType;
  supplier: string;
  quantity: number;
  amount: number;
  description: string;
  action_taken: string;
}

export interface AcceptanceFunnel {
  stage: QCStage;
  stage_name: string;
  count: number;
  rejected: number;
  returned: number;
}

export interface QCResponse {
  prescriptions: VPPrescription[];
  defects: QCDefect[];
  funnel: AcceptanceFunnel[];
  summary: {
    open_prescriptions: number;
    critical_prescriptions: number;
    total_defects: number;
    defect_rate_percent: number;
    avg_resolution_days: number;
    total_defect_amount: number;
    acceptance_pass_rate: number;
  };
}

// ==================== УПРАВЛЕНИЕ КООПЕРАЦИЕЙ ====================

export type SupplierRating = 'A' | 'B' | 'C' | 'D';
export type SupplierRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Supplier {
  id: string;
  name: string;
  inn: string;
  region: string;
  is_sole: boolean;
  is_sanctioned: boolean;
  rating: SupplierRating;
  risk: SupplierRisk;
  total_contracts: number;
  total_amount: number;
  on_time_percent: number;
  quality_percent: number;
  price_index: number;
  reliability_score: number;
  incidents_count: number;
  last_incident_date: string | null;
  certifications: string[];
  products: string[];
}

export interface SupplierDependency {
  igk_code: string;
  igk_subject: string;
  critical_suppliers: string[];
  sole_source_risk: boolean;
  alternative_suppliers: string[];
}

export interface SupplierResponse {
  suppliers: Supplier[];
  dependencies: SupplierDependency[];
  summary: {
    total_suppliers: number;
    sole_source_count: number;
    sanctioned_count: number;
    avg_rating_score: number;
    high_risk_count: number;
    total_incidents: number;
    top_suppliers_count: number;
  };
}

// ==================== КАЗНАЧЕЙСТВО И ОБС ====================

export type OBSStatus = 'normal' | 'warning' | 'blocked' | 'audit';
export type ReportStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'overdue';

export interface OBSAccount {
  igk_code: string;
  contract_number: string;
  bank_name: string;
  account_number: string;
  balance: number;
  limit_amount: number;
  limit_used_percent: number;
  status: OBSStatus;
  last_transaction_date: string;
  risks: string[];
}

export interface TreasuryReport {
  id: string;
  period: string;
  type: 'monthly' | 'quarterly' | 'annual';
  status: ReportStatus;
  sent_date: string | null;
  accepted_date: string | null;
  rejection_reason: string | null;
  igk_count: number;
  total_amount: number;
}

export interface Penalty {
  id: string;
  date: string;
  type: 'customer' | 'treasury' | 'contractor';
  linked_igk: string | null;
  description: string;
  amount: number;
  status: 'accrued' | 'paid' | 'disputed' | 'cancelled';
}

export interface TreasuryResponse {
  obs_accounts: OBSAccount[];
  reports: TreasuryReport[];
  penalties: Penalty[];
  summary: {
    total_obs_balance: number;
    total_limit: number;
    limit_usage_percent: number;
    blocked_accounts: number;
    overdue_reports: number;
    accepted_reports: number;
    total_penalties: number;
    paid_penalties: number;
    disputed_penalties: number;
  };
}

// ==================== ТЕНДЕРНЫЙ ПОРТФЕЛЬ ====================

export type TenderStage = 'planning' | 'market_research' | 'rfp_sent' | 'negotiation' | 'contract_signed' | 'cancelled';
export type TenderType = 'open' | 'closed' | 'single_source' | 'framework';

export interface Tender {
  id: string;
  number: string;
  title: string;
  type: TenderType;
  stage: TenderStage;
  planned_amount: number;
  final_amount: number | null;
  savings_amount: number;
  savings_percent: number | null;
  participants_count: number;
  winner: string | null;
  created_date: string;
  deadline: string;
  signed_date: string | null;
  linked_igk: string | null;
  responsible: string;
  risks: string[];
}

export interface PriceTrend {
  category: string;
  periods: Array<{ period: string; price: number; change_percent: number }>;
}

export interface BudgetForecast {
  year: number;
  planned: number;
  actual: number | null;
  by_quarter: Array<{ quarter: string; planned: number; actual: number | null }>;
}

export interface TenderResponse {
  tenders: Tender[];
  price_trends: PriceTrend[];
  budget_forecast: BudgetForecast;
  summary: {
    active_tenders: number;
    total_planned_amount: number;
    total_savings: number;
    avg_savings_percent: number;
    completed_tenders: number;
    cancelled_tenders: number;
    next_year_forecast: number;
  };
}