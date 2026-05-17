/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DisplayType = 'normal' | 'disabled' | 'hidden';
export type CheckBoxDefault = 'checked' | 'unchecked' | 'default';
export type FormSource = 'custom' | 'template';

export interface FieldLayout {
  columnBreak: boolean;
  spaceBefore: boolean;
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface APIConfig {
  url: string;
  method: string;
  labelKey: string;
  valueKey: string;
  /** Primary search field for master-data autocomplete (e.g. hsncode). */
  searchKey?: string;
}

export interface DataSource {
  type:
    | 'static'
    | 'api'
    | 'netsuite_currency'
    | 'netsuite_hsn'
    | 'netsuite_employees'
    | 'netsuite_location';
  options?: FieldOption[];
  /** Optional REST path relative to /api (mirrors apiConfig.url for presets). */
  endpoint?: string;
  apiConfig?: APIConfig;
}

export interface Field {
  id: string;                 // internal field name (e.g., "approvalStatus")
  label: string;              // UI label (e.g., "Approval Status")
  description?: string;       // NetSuite internal description
  type: string;               // data type (string, boolean, RecordRef, dateTime, double, etc.)
  section: 'body' | 'sublist';
  subSection: 'item' | 'expense' | null;
  group: string;              // UI section grouping
  tab: string;                // Main, Items, Shipping, etc.
  displayType: DisplayType;
  mandatory: boolean;
  visible: boolean;
  checkBoxDefault: CheckBoxDefault;
  helpText?: string;          // from NetSuite help
  defaultValue: string;       // Internal prototype value
  layout: FieldLayout;        // Internal prototype layout
  dataSource?: DataSource;
  isSystemField?: boolean;
}

export interface CatalogueTab {
  name: string;
  groups: { name: string; fields: Field[] }[];
  subSections: Record<string, Field[]>;
}

export interface GroupedCatalogue {
  tabs: CatalogueTab[];
}

export interface FieldGroup {
  id: string;
  name: string;
  fields: Field[];
}

export interface Tab {
  id: string;
  name: string;
  fieldGroups: FieldGroup[];
  itemSublist?: Field[];
  expenseSublist?: Field[];
}

export type TransactionType = 'purchase_order' | 'sales_order' | 'accounts_payable' | 'accounts_receivable';

export type UserRole = 'super_admin' | 'client_admin' | 'manager' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  jobTitle?: string;
  employeeId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface CurrencyRow {
  _id: string;
  internalId: string;
  name: string;
  source?: string;
  lastSyncedAt?: string;
  isActive: boolean;
}

export interface CurrencySyncSummary {
  success: boolean;
  fetched: number;
  inserted: number;
  updated: number;
}

export interface HSNRow {
  _id: string;
  internalId: string;
  name: string;
  hsncode: string;
  hsndescription?: string;
  source?: string;
  isActive?: boolean;
  lastSyncedAt?: string;
  updatedAt?: string;
}

export interface HSNListResponse {
  success: boolean;
  count: number;
  page: number;
  limit: number;
  data: HSNRow[];
}

export type HSNSyncSummary = CurrencySyncSummary;

export interface LocationRow {
  _id: string;
  internalId: string;
  name: string;
  subsidiary?: string;
  source?: string;
  isActive?: boolean;
  lastSyncedAt?: string;
  updatedAt?: string;
}

export interface LocationListResponse {
  success: boolean;
  count: number;
  page: number;
  limit: number;
  data: LocationRow[];
}

export type LocationSyncSummary = CurrencySyncSummary;

export interface Approval {
  userId: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  actionAt: string | null;
}

export interface WorkflowLevel {
  level: number;
  status: 'pending' | 'approved' | 'rejected';
  approvers: Approval[];
}

export interface Submission {
  id: string;
  formId: string;
  userId: string;
  userName?: string;
  formName?: string;
  companyId: string;
  status: 'pending' | 'approved' | 'rejected' | 'failed' | 'submitted';
  currentLevel?: number;
  approvals?: WorkflowLevel[];
  submittedAt?: string;
  netsuiteAt?: string;
  netsuiteId?: string;
  errorMessage?: string;
}

export interface CustomForm {
  id: string;
  name: string;
  customerId: string; // Maps to companyId
  transactionType: TransactionType;
  tabs: Tab[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  source: FormSource;
  status?: string;    // e.g., 'Submitted', 'Draft', 'In Progress'
  currentLevel?: number;
  templateId?: string;
  assignedTo?: string[]; // Array of employee user IDs
}

export interface CatalogueData {
  name: string;
  tabs: string[];
  fieldGroups: string[];
  fields: Field[];
}

export interface FormTemplate {
  id: string;
  name: string;
  transactionType: TransactionType;
  description: string;
  tags: string[];
  tabs: Tab[];
}

export interface AppState {
  user: User | null;
  users: User[]; 
  forms: CustomForm[];
  companies: Company[];
  templates: FormTemplate[];
  submissions: Submission[];
  currentForm: CustomForm | null;
  activeTabId: string;
  selectedFieldId: string | null;
  transactionType: TransactionType;
  catalogues: Record<TransactionType, CatalogueData>;
  groupedCatalogues: Record<TransactionType, GroupedCatalogue | null>;
  currencies: CurrencyRow[];
  loadingCurrencies: boolean;
  hsnCodes: HSNRow[];
  hsnListCount: number;
  hsnListPage: number;
  hsnListLimit: number;
  loadingHSN: boolean;
  locations: LocationRow[];
  locationListCount: number;
  locationListPage: number;
  locationListLimit: number;
  loadingLocations: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth Actions
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  
  // Data Fetching
  fetchCompanies: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchForms: (companyId?: string) => Promise<void>;
  fetchFormById: (id: string) => Promise<void>;
  fetchMyForms: (transactionType?: string) => Promise<void>;
  fetchMyFormDetails: (formId: string) => Promise<CustomForm | null>;
  fetchSubmissions: () => Promise<void>;
  fetchMySubmissions: (transactionType?: string) => Promise<void>;
  fetchMyStats: (transactionType?: string) => Promise<{total: number, approved: number, pending: number, rejected: number} | null>;
  fetchCatalogue: (type: TransactionType) => Promise<void>;
  fetchGroupedCatalogue: (type: TransactionType) => Promise<void>;
  fetchCurrencies: (opts?: { includeInactive?: boolean }) => Promise<void>;
  syncCurrencies: () => Promise<CurrencySyncSummary>;
  fetchHSN: (opts?: {
    page?: number;
    limit?: number;
    search?: string;
    includeInactive?: boolean;
  }) => Promise<void>;
  searchHSN: (q: string, limit?: number) => Promise<HSNRow[]>;
  syncHSN: () => Promise<HSNSyncSummary>;
  fetchLocations: (opts?: {
    page?: number;
    limit?: number;
    search?: string;
    includeInactive?: boolean;
    subsidiary?: string;
  }) => Promise<void>;
  searchLocations: (q: string, limit?: number, subsidiary?: string) => Promise<LocationRow[]>;
  syncLocations: () => Promise<LocationSyncSummary>;

  // Form Management
  createForm: (name: string, companyId: string, transactionType: TransactionType, tabs?: Tab[]) => Promise<void>;
  updateForm: (id: string, updates: Partial<CustomForm>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  cloneForm: (id: string, targetCompanyId?: string, newName?: string) => Promise<void>;
  assignForm: (formId: string, userIds: string[]) => Promise<void>;
  submitForm: (formId: string, values: Record<string, any>) => Promise<void>;
  retrySubmission: (submissionId: string) => Promise<void>;
  fetchPendingApprovals: () => Promise<Submission[]>;
  approveSubmission: (submissionId: string) => Promise<void>;
  rejectSubmission: (submissionId: string) => Promise<void>;
  
  // UI Actions
  setActiveTabId: (id: string) => void;
  setSelectedFieldId: (id: string | null) => void;
  setCurrentForm: (form: CustomForm | null) => void;
  setTransactionType: (type: TransactionType) => void;
  updateCurrentForm: (updates: Partial<CustomForm>) => void;
  toggleField: (field: Field) => void;
  addAllFields: () => void;
  
  // Company & User Actions
  addCompany: (name: string) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'isActive' | 'createdAt'> & { password?: string }) => Promise<void>;
  updateUserStatus: (userId: string, isActive: boolean) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
}
