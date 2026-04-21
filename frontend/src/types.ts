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
}

export interface DataSource {
  type: 'static' | 'api';
  options?: FieldOption[];
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

export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string; // If customer
  companyName?: string; // Add company name for dashboard display
  password?: string; // Mock password
  jobTitle?: string;
  employeeId?: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  formId: string;
  userId: string;
  userName?: string;
  formName?: string;
  companyId: string;
  status: 'Not Started' | 'Submitted' | 'failed' | 'submitted';
  submittedAt?: string;
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
  fetchMyForms: () => Promise<void>;
  fetchMyFormDetails: (formId: string) => Promise<CustomForm | null>;
  fetchSubmissions: () => Promise<void>;
  fetchCatalogue: (type: TransactionType) => Promise<void>;
  fetchGroupedCatalogue: (type: TransactionType) => Promise<void>;
  
  // Form Management
  createForm: (name: string, companyId: string, transactionType: TransactionType, tabs?: Tab[]) => Promise<void>;
  updateForm: (id: string, updates: Partial<CustomForm>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  cloneForm: (id: string, targetCompanyId?: string, newName?: string) => Promise<void>;
  assignUsers: (formId: string, userIds: string[]) => Promise<void>;
  submitForm: (formId: string, values: Record<string, any>) => Promise<void>;
  retrySubmission: (submissionId: string) => Promise<void>;
  
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
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}
