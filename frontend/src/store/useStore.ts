import { create } from 'zustand';
import { AppState, CustomForm, Field, User, TransactionType, CatalogueData, DisplayType, CheckBoxDefault, FormTemplate, Tab, FormSource, Company, Submission } from '../types';

/**
 * Utility to map "raw" NetSuite field data to our UI-ready model.
 */
const mapNetSuiteField = (
  id: string,
  label: string,
  type: string,
  fieldGroup: string,
  tab: string,
  mandatory: boolean = false,
  helpText: string = ''
): Field => ({
  id,
  label: label || id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1'),
  type,
  fieldGroup: fieldGroup || 'Custom',
  tab: tab || 'Main',
  mandatory,
  visible: true,
  displayType: 'normal',
  checkBoxDefault: 'default',
  helpText,
  defaultValue: '',
  layout: { columnBreak: false, spaceBefore: false }
});

const CATALOGUES: Record<TransactionType, CatalogueData> = {
  purchase_order: {
    name: 'Purchase Order',
    tabs: ['Main', 'Items', 'Shipping', 'Billing', 'Accounting', 'Tax Details', 'System Information'],
    fieldGroups: ['Primary Information', 'Classification', 'India Tax Information', 'Shipping', 'Billing', 'Accounting', 'System Information'],
    fields: [
      mapNetSuiteField('approvalStatus', 'Approval Status', 'RecordRef', 'Primary Information', 'Main', false, 'Reflects the state of the transaction in approval workflow'),
      mapNetSuiteField('entity', 'Vendor', 'RecordRef', 'Primary Information', 'Main', true, 'Select the vendor for this purchase'),
      mapNetSuiteField('tranDate', 'Date', 'dateTime', 'Primary Information', 'Main', true, 'The date the purchase order is issued'),
      mapNetSuiteField('tranId', 'PO #', 'string', 'Primary Information', 'Main', false, 'Purchase order identification number'),
      mapNetSuiteField('memo', 'Memo', 'string', 'Primary Information', 'Main', false, 'Internal notes for this transaction'),
      mapNetSuiteField('subsidiary', 'Subsidiary', 'RecordRef', 'Classification', 'Main', true),
      mapNetSuiteField('department', 'Department', 'RecordRef', 'Classification', 'Main', false),
      mapNetSuiteField('class', 'Class', 'RecordRef', 'Classification', 'Main', false),
      mapNetSuiteField('location', 'Location', 'RecordRef', 'Classification', 'Main', false),
      mapNetSuiteField('taxTotal', 'Tax Total', 'double', 'India Tax Information', 'Tax Details', false),
      mapNetSuiteField('placeOfSupply', 'Place of Supply', 'string', 'India Tax Information', 'Tax Details', false),
      mapNetSuiteField('shipDate', 'Ship Date', 'dateTime', 'Shipping', 'Shipping', false),
      mapNetSuiteField('shipMethod', 'Ship Method', 'RecordRef', 'Shipping', 'Shipping', false),
      mapNetSuiteField('billAddressList', 'Billing Address', 'RecordRef', 'Billing', 'Billing', true),
      mapNetSuiteField('currency', 'Currency', 'RecordRef', 'Accounting', 'Accounting', true),
      mapNetSuiteField('terms', 'Terms', 'RecordRef', 'Accounting', 'Accounting', false),
      mapNetSuiteField('status', 'Status', 'string', 'System Information', 'System Information', false),
      mapNetSuiteField('createdDate', 'Date Created', 'dateTime', 'System Information', 'System Information', false),
    ]
  },
  sales_order: {
    name: 'Sales Order',
    tabs: ['Main', 'Items', 'Shipping', 'Billing', 'Accounting', 'System Information'],
    fieldGroups: ['Primary Information', 'Classification', 'Shipping', 'Billing', 'Accounting', 'System Information'],
    fields: [
      mapNetSuiteField('entity', 'Customer', 'RecordRef', 'Primary Information', 'Main', true),
      mapNetSuiteField('tranDate', 'Order Date', 'dateTime', 'Primary Information', 'Main', true),
      mapNetSuiteField('tranId', 'SO #', 'string', 'Primary Information', 'Main', false),
      mapNetSuiteField('status', 'Order Status', 'string', 'Primary Information', 'Main', false),
      mapNetSuiteField('total', 'Amount', 'double', 'Primary Information', 'Main', false),
      mapNetSuiteField('subsidiary', 'Subsidiary', 'RecordRef', 'Classification', 'Main', true),
      mapNetSuiteField('department', 'Department', 'RecordRef', 'Classification', 'Main', false),
      mapNetSuiteField('shipAddressList', 'Shipping Address', 'RecordRef', 'Shipping', 'Shipping', true),
      mapNetSuiteField('billAddressList', 'Billing Address', 'RecordRef', 'Billing', 'Billing', true),
      mapNetSuiteField('currency', 'Currency', 'RecordRef', 'Accounting', 'Accounting', true),
      mapNetSuiteField('createdDate', 'Date Created', 'dateTime', 'System Information', 'System Information', false),
    ]
  },
  accounts_payable: {
    name: 'Accounts Payable',
    tabs: ['Main', 'Expenses', 'Journal', 'System Information'],
    fieldGroups: ['Primary Information', 'Classification', 'Accounting', 'System Information'],
    fields: [
      mapNetSuiteField('entity', 'Vendor', 'RecordRef', 'Primary Information', 'Main', true),
      mapNetSuiteField('tranDate', 'Bill Date', 'dateTime', 'Primary Information', 'Main', true),
      mapNetSuiteField('dueDate', 'Due Date', 'dateTime', 'Primary Information', 'Main', true),
      mapNetSuiteField('approvalStatus', 'Approval Status', 'RecordRef', 'Primary Information', 'Main', false),
      mapNetSuiteField('amount', 'Amount', 'double', 'Primary Information', 'Main', false),
      mapNetSuiteField('subsidiary', 'Subsidiary', 'RecordRef', 'Classification', 'Main', true),
      mapNetSuiteField('taxTotal', 'Tax Total', 'double', 'Primary Information', 'Main', false),
      mapNetSuiteField('currency', 'Currency', 'RecordRef', 'Accounting', 'Accounting', true),
      mapNetSuiteField('createdDate', 'Date Created', 'dateTime', 'System Information', 'System Information', false),
    ]
  },
  accounts_receivable: {
    name: 'Accounts Receivable',
    tabs: ['Main', 'Items', 'Journal', 'System Information'],
    fieldGroups: ['Primary Information', 'Classification', 'Accounting', 'System Information'],
    fields: [
      mapNetSuiteField('entity', 'Customer', 'RecordRef', 'Primary Information', 'Main', true),
      mapNetSuiteField('tranDate', 'Invoice Date', 'dateTime', 'Primary Information', 'Main', true),
      mapNetSuiteField('status', 'Payment Status', 'string', 'Primary Information', 'Main', false),
      mapNetSuiteField('amount', 'Amount', 'double', 'Primary Information', 'Main', false),
      mapNetSuiteField('subsidiary', 'Subsidiary', 'RecordRef', 'Classification', 'Main', true),
      mapNetSuiteField('taxTotal', 'Tax Total', 'double', 'Primary Information', 'Main', false),
      mapNetSuiteField('currency', 'Currency', 'RecordRef', 'Accounting', 'Accounting', true),
      mapNetSuiteField('terms', 'Terms', 'RecordRef', 'Accounting', 'Accounting', false),
      mapNetSuiteField('createdDate', 'Date Created', 'dateTime', 'System Information', 'System Information', false),
    ]
  }
};

const MOCK_COMPANIES: Company[] = [
  { id: 'comp_1', name: 'HDFC Bank', createdAt: '2024-01-01' },
  { id: 'comp_2', name: 'TCS', createdAt: '2024-01-05' },
  { id: 'comp_3', name: 'Infosys', createdAt: '2024-01-10' },
  { id: 'comp_4', name: 'Wipro', createdAt: '2024-01-15' },
  { id: 'comp_5', name: 'Reliance', createdAt: '2024-01-20' }
];

const MOCK_USERS: User[] = [
  { id: 'admin_1', name: 'Super Admin', email: 'admin@example.com', role: 'admin', password: 'password123' },
  { id: 'emp_1', name: 'Amit Kumar', email: 'hdfc_emp@example.com', role: 'customer', companyId: 'comp_1', password: 'password123', jobTitle: 'Procurement Officer', employeeId: 'HDFC001' },
  { id: 'emp_2', name: 'Suresh Raina', email: 'tcs_emp@example.com', role: 'customer', companyId: 'comp_2', password: 'password123', jobTitle: 'Operations Manager', employeeId: 'TCS778' }
];

const TEMPLATES: FormTemplate[] = [
  {
    id: 'template_po_standard',
    name: 'Standard Purchase Order',
    transactionType: 'purchase_order',
    description: 'Comprehensive blueprint including approval workflows, primary vendor data, and cross-subsidiary classification.',
    tags: ['Best Practice', 'Common'],
    tabs: [
      {
        id: `tab_po_std_1`,
        name: 'Main',
        fieldGroups: [
          {
            id: `gp_po_std_1`,
            name: 'Primary Information',
            fields: CATALOGUES.purchase_order.fields.filter(f => ['approvalStatus', 'entity', 'tranDate', 'tranId'].includes(f.id))
          },
          {
            id: `gp_po_std_2`,
            name: 'Classification',
            fields: CATALOGUES.purchase_order.fields.filter(f => ['subsidiary', 'department', 'class', 'location'].includes(f.id))
          }
        ]
      },
      {
        id: `tab_po_std_2`,
        name: 'System Information',
        fieldGroups: [
          {
            id: `gp_po_std_3`,
            name: 'System Information',
            fields: CATALOGUES.purchase_order.fields.filter(f => ['status', 'createdDate'].includes(f.id))
          }
        ]
      }
    ]
  },
  {
    id: 'template_po_minimal',
    name: 'Minimal PO',
    transactionType: 'purchase_order',
    description: 'Optimized for high-velocity entry. Contains only mandatory NetSuite fields and core identification.',
    tags: ['Minimal'],
    tabs: [
      {
        id: `tab_po_min_1`,
        name: 'Main',
        fieldGroups: [
          {
            id: `gp_po_min_1`,
            name: 'Key Identification',
            fields: CATALOGUES.purchase_order.fields.filter(f => ['entity', 'tranDate', 'subsidiary'].includes(f.id))
          }
        ]
      }
    ]
  },
  {
    id: 'template_so_standard',
    name: 'Standard Sales Order',
    transactionType: 'sales_order',
    description: 'Standard Sales Order with customer defaults and status tracking.',
    tags: ['Best Practice'],
    tabs: [
      {
        id: `tab_so_std_1`,
        name: 'Main',
        fieldGroups: [
          {
            id: `gp_so_std_1`,
            name: 'Primary Information',
            fields: CATALOGUES.sales_order.fields.filter(f => ['entity', 'tranDate', 'tranId', 'status'].includes(f.id))
          }
        ]
      }
    ]
  },
  {
    id: 'template_ap_standard',
    name: 'Vendor Bill Template',
    transactionType: 'accounts_payable',
    description: 'Accounts Payable layout focused on bill dates, due dates, and amount verification.',
    tags: ['Advanced'],
    tabs: [
      {
        id: `tab_ap_std_1`,
        name: 'Main',
        fieldGroups: [
          {
            id: `gp_ap_std_1`,
            name: 'Primary Information',
            fields: CATALOGUES.accounts_payable.fields.filter(f => ['entity', 'tranDate', 'dueDate', 'amount'].includes(f.id))
          }
        ]
      }
    ]
  },
  {
    id: 'template_ar_standard',
    name: 'Invoice Template',
    transactionType: 'accounts_receivable',
    description: 'Accounts Receivable layout for efficient invoicing and payment tracking.',
    tags: ['Common'],
    tabs: [
      {
        id: `tab_ar_std_1`,
        name: 'Main',
        fieldGroups: [
          {
            id: `gp_ar_std_1`,
            name: 'Invoicing Details',
            fields: CATALOGUES.accounts_receivable.fields.filter(f => ['entity', 'tranDate', 'status', 'amount'].includes(f.id))
          }
        ]
      }
    ]
  }
];

const INITIAL_FORMS: CustomForm[] = [
  {
    id: 'form_1',
    name: 'HDFC Enterprise PO Form',
    customerId: 'comp_1',
    transactionType: 'purchase_order',
    createdBy: 'Super Admin',
    createdAt: '2024-03-10',
    updatedAt: '2024-03-15',
    source: 'custom',
    assignedTo: ['emp_1'],
    tabs: [
      {
        id: 't1',
        name: 'Main',
        fieldGroups: [
          {
            id: 'g1',
            name: 'Primary Information',
            fields: CATALOGUES.purchase_order.fields.slice(0, 5)
          }
        ]
      }
    ]
  }
];

export const useStore = create<AppState>((set, get) => ({
  user: null,
  users: MOCK_USERS,
  forms: INITIAL_FORMS,
  companies: MOCK_COMPANIES,
  templates: TEMPLATES,
  submissions: [],
  currentForm: null,
  transactionType: 'purchase_order',
  catalogues: CATALOGUES,

  login: (email: string, password?: string) => {
    const user = get().users.find(u => u.email === email && (!password || u.password === password));
    if (user) {
      set({ user });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null }),
  setForms: (forms: CustomForm[]) => set({ forms }),
  setCurrentForm: (form: CustomForm | null) => set({ currentForm: form }),
  setTransactionType: (type: TransactionType) => set({ transactionType: type }),
  updateCurrentForm: (updates: Partial<CustomForm>) => set((state) => ({
    currentForm: state.currentForm ? { ...state.currentForm, ...updates } : null
  })),
  createForm: (name: string, customerId: string, transactionType: TransactionType, tabs?: Tab[], source: FormSource = 'custom', templateId?: string) => {
    const newForm: CustomForm = {
      id: `form_${Math.random().toString(36).substr(2, 9)}`,
      name,
      customerId,
      transactionType,
      source,
      templateId,
      assignedTo: [],
      tabs: tabs || [
        {
          id: `tab_${Math.random().toString(36).substr(2, 5)}`,
          name: 'Main',
          fieldGroups: [
            {
              id: `group_${Math.random().toString(36).substr(2, 5)}`,
              name: 'Primary Information',
              fields: []
            }
          ]
        }
      ],
      createdBy: get().user?.name || 'Admin',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ forms: [...state.forms, newForm], currentForm: newForm }));
  },
  addForm: (form: CustomForm) => set((state) => ({ forms: [...state.forms, form] })),
  deleteForm: (id: string) => set((state) => ({ forms: state.forms.filter(f => f.id !== id) })),
  cloneForm: (id: string, customerId?: string) => set((state) => {
    const formToClone = state.forms.find(f => f.id === id);
    if (!formToClone) return state;
    const clonedForm: CustomForm = {
      ...formToClone,
      id: `form_${Math.random().toString(36).substr(2, 9)}`,
      name: `${formToClone.name} (Copy)`,
      customerId: customerId || formToClone.customerId,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    return { forms: [...state.forms, clonedForm] };
  }),

  updateFormAssignment: (formId: string, employeeIds: string[]) => set((state) => ({
    forms: state.forms.map(f => f.id === formId ? { ...f, assignedTo: employeeIds } : f)
  })),

  toggleField: (field: Field) => set((state) => {
    if (!state.currentForm) return state;

    const isAlreadyAdded = state.currentForm.tabs.some(t => 
      t.fieldGroups.some(g => g.fields.some(f => f.id === field.id))
    );

    let newTabs = [...state.currentForm.tabs];

    if (isAlreadyAdded) {
      // Remove field from all groups
      newTabs = newTabs.map(tab => ({
        ...tab,
        fieldGroups: tab.fieldGroups.map(group => ({
          ...group,
          fields: group.fields.filter(f => f.id !== field.id)
        }))
      }));
    } else {
      // Add field to the target field group or first available group in the field's tab
      let fieldTab = newTabs.find(t => t.name === field.tab);
      
      // If the tab doesn't exist in the form yet, add it
      if (!fieldTab) {
        fieldTab = {
          id: `tab_${Math.random().toString(36).substr(2, 5)}`,
          name: field.tab,
          fieldGroups: []
        };
        newTabs.push(fieldTab);
      }

      let targetGroup = fieldTab.fieldGroups.find(g => g.name === field.fieldGroup);

      // If the field group doesn't exist in the tab yet, add it
      if (!targetGroup) {
        targetGroup = {
          id: `group_${Math.random().toString(36).substr(2, 5)}`,
          name: field.fieldGroup,
          fields: []
        };
        fieldTab.fieldGroups.push(targetGroup);
      }

      // Add the field
      targetGroup.fields.push({ ...field });
    }

    return {
      currentForm: {
        ...state.currentForm,
        tabs: newTabs
      }
    };
  }),

  addCompany: (name: string) => set((state) => ({
    companies: [...state.companies, { id: `comp_${Math.random().toString(36).substr(2, 5)}`, name, createdAt: new Date().toISOString().split('T')[0] }]
  })),
  updateCompany: (id: string, updates: Partial<Company>) => set((state) => ({
    companies: state.companies.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  deleteCompany: (id: string) => set((state) => ({
    companies: state.companies.filter(c => c.id !== id),
    users: state.users.filter(u => u.companyId !== id)
  })),

  addUser: (userData: Omit<User, 'id'>) => set((state) => ({
    users: [...state.users, { ...userData, id: `user_${Math.random().toString(36).substr(2, 5)}` }]
  })),
  updateUser: (id: string, updates: Partial<User>) => set((state) => ({
    users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
  })),
  deleteUser: (id: string) => set((state) => ({
    users: state.users.filter(u => u.id !== id)
  })),

  addSubmission: (submission: Omit<Submission, 'id'>) => set((state) => ({
    submissions: [...state.submissions, { ...submission, id: `sub_${Math.random().toString(36).substr(2, 5)}` }]
  })),
}));
