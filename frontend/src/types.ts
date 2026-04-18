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

export interface Field {
  id: string;                 // internal field name (e.g., "approvalStatus")
  label: string;              // UI label (e.g., "Approval Status")
  description?: string;       // NetSuite internal description
  type: string;               // data type (string, boolean, RecordRef, dateTime, double, etc.)
  fieldGroup: string;         // UI section grouping
  tab: string;                // Main, Items, Shipping, etc.
  displayType: DisplayType;
  mandatory: boolean;
  visible: boolean;
  checkBoxDefault: CheckBoxDefault;
  helpText?: string;          // from NetSuite help
  defaultValue: string;       // Internal prototype value
  layout: FieldLayout;        // Internal prototype layout
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
}

export type TransactionType = 'purchase_order' | 'sales_order' | 'accounts_payable' | 'accounts_receivable';

export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string; // If customer
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
  companyId: string;
  values: Record<string, any>;
  status: 'not_started' | 'in_progress' | 'submitted';
  submittedAt?: string;
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
  users: User[]; // All users (admins + employees)
  forms: CustomForm[];
  companies: Company[];
  templates: FormTemplate[];
  submissions: Submission[];
  currentForm: CustomForm | null;
  transactionType: TransactionType;
  catalogues: Record<TransactionType, CatalogueData>;
  
  // Actions
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  setForms: (forms: CustomForm[]) => void;
  setCurrentForm: (form: CustomForm | null) => void;
  setTransactionType: (type: TransactionType) => void;
  updateCurrentForm: (updates: Partial<CustomForm>) => void;
  
  // Form Management
  createForm: (name: string, customerId: string, transactionType: TransactionType, tabs?: Tab[], source?: FormSource, templateId?: string) => void;
  addForm: (form: CustomForm) => void;
  deleteForm: (id: string) => void;
  cloneForm: (id: string, customerId?: string) => void;
  toggleField: (field: Field) => void;
  updateFormAssignment: (formId: string, employeeIds: string[]) => void;

  // Company & User Management
  addCompany: (name: string) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Submissions
  addSubmission: (submission: Omit<Submission, 'id'>) => void;
}
