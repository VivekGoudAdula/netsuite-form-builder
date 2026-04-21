import { create } from 'zustand';
import api from '../api/client';
import { catalogueApi } from '../api/catalogue';
import { AppState, CustomForm, Field, User, TransactionType, CatalogueData, Tab, Company, Submission } from '../types';

/**
 * Utility to map "raw" NetSuite field data to our UI-ready model.
 */
const mapNetSuiteField = (
  id: string,
  label: string,
  type: string,
  group: string,
  tab: string,
  mandatory: boolean = false,
  section: 'body' | 'sublist' = 'body',
  subSection: 'item' | 'expense' | null = null,
  dataSource: any = null,
  helpText: string = ''
): Field => ({
  id,
  label: label || id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1'),
  type,
  group: group || 'Custom',
  tab: tab || 'Main',
  section,
  subSection,
  mandatory,
  visible: true,
  displayType: 'normal',
  checkBoxDefault: 'default',
  helpText,
  defaultValue: '',
  layout: { columnBreak: false, spaceBefore: false },
  dataSource
});

const CATALOGUES: Record<TransactionType, CatalogueData> = {
  purchase_order: { 
    name: 'Purchase Order', 
    tabs: ['Main', 'Shipping', 'Billing', 'Tax Details', 'Items'], 
    fieldGroups: ['Primary Information', 'Classification', 'Shipping', 'Billing', 'Tax Details', 'System Information', 'Line Items', 'Expenses'], 
    fields: [
      // --- PRIMARY INFORMATION ---
      mapNetSuiteField('customform', 'Custom Form', 'select', 'Primary Information', 'Main', true, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/custom-forms', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('entity', 'Vendor', 'select', 'Primary Information', 'Main', true, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/vendors', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('otherrefnum', 'Vendor #', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField('employee', 'Employee', 'select', 'Primary Information', 'Main', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/employees', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('trandate', 'Date', 'date', 'Primary Information', 'Main', true),
      mapNetSuiteField('tranid', 'PO #', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField('duedate', 'Receive By', 'date', 'Primary Information', 'Main'),
      mapNetSuiteField('memo', 'Memo', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField('approvalstatus', 'Approval Status', 'select', 'Primary Information', 'Main', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/approval-status', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('nextapprover', 'Next Approver', 'select', 'Primary Information', 'Main', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/employees', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('supervisorapproval', 'Supervisor Approval', 'checkbox', 'Primary Information', 'Main'),
      mapNetSuiteField('message', 'Vendor Message', 'textarea', 'Primary Information', 'Main'),
      mapNetSuiteField('email', 'Email', 'emails', 'Primary Information', 'Main'),
      mapNetSuiteField('tobeemailed', 'To Be E-mailed', 'checkbox', 'Primary Information', 'Main'),
      mapNetSuiteField('tobefaxed', 'To Be Faxed', 'checkbox', 'Primary Information', 'Main'),
      mapNetSuiteField('tobeprinted', 'To Be Printed', 'checkbox', 'Primary Information', 'Main'),
      mapNetSuiteField('createdfrom', 'Created From', 'select', 'Primary Information', 'Main', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/transactions', method: 'GET', labelKey: 'name', valueKey: 'id' } }),

      // --- CLASSIFICATION ---
      mapNetSuiteField('subsidiary', 'Subsidiary', 'select', 'Classification', 'Main', true, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/subsidiaries', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('department', 'Department', 'select', 'Classification', 'Main', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/departments', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('class', 'Class', 'select', 'Classification', 'Main', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/classifications', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('location', 'Location', 'select', 'Classification', 'Main', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/locations', method: 'GET', labelKey: 'name', valueKey: 'id' } }),

      // --- SHIPPING ---
      mapNetSuiteField('shipdate', 'Ship Date', 'date', 'Shipping', 'Shipping', false),
      mapNetSuiteField('shipmethod', 'Ship Via', 'select', 'Shipping', 'Shipping', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/shipping-methods', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('shipto', 'Ship To', 'select', 'Shipping', 'Shipping', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/customers', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('shipaddress', 'Ship To', 'address', 'Shipping', 'Shipping'),
      mapNetSuiteField('shippingaddress', 'Shipping Address Summary', 'summary', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipaddressee', 'Shipping Addressee', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipattention', 'Shipping Attention', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipaddr1', 'Shipping Address Line 1', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipaddr2', 'Shipping Address Line 2', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipaddr3', 'Shipping Address Line 3', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipcity', 'Shipping Address City', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipstate', 'Shipping Address State', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipzip', 'Shipping Address Zip Code', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipcountry', 'Shipping Address Country', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipphone', 'Shipping Phone', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipisresidential', 'Residential', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('shipoverride', 'Ship Override', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('fob', 'FOB', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('linkedtrackingnumbers', 'Tracking #', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('trackingnumbers', 'Additional Tracking #', 'text', 'Shipping', 'Shipping'),
      mapNetSuiteField('returntrackingnumbers', 'Return Tracking #', 'text', 'Shipping', 'Shipping'),

      // --- BILLING ---
      mapNetSuiteField('terms', 'Terms', 'select', 'Billing', 'Billing', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/terms', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('billaddress', 'Vendor', 'address', 'Billing', 'Billing'),
      mapNetSuiteField('billingaddress', 'Billing Address Summary', 'summary', 'Billing', 'Billing'),
      mapNetSuiteField('billaddressee', 'Billing Addressee', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('billattention', 'Billing Attention', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('billaddr1', 'Billing Address Line 1', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('billaddr2', 'Billing Address Line 2', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('billaddr3', 'Billing Address Line 3', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('billcity', 'Billing Address City', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('billstate', 'Billing Address State', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('billzip', 'Billing Address Zip Code', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('billcountry', 'Billing Address Country', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('billphone', 'Billing Phone', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('billisresidential', 'Residential', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('currency', 'Currency', 'select', 'Billing', 'Billing', true, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/currencies', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('currencyname', 'Currency Name', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('currencysymbol', 'Currency Symbol', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('exchangerate', 'Exchange Rate', 'currency2', 'Billing', 'Billing', true),
      mapNetSuiteField('availablevendorcredit', 'Available Vendor Credit', 'currency', 'Billing', 'Billing'),
      mapNetSuiteField('balance', 'Balance', 'currency', 'Billing', 'Billing'),
      mapNetSuiteField('isbasecurrency', 'Base Currency', 'checkbox', 'Billing', 'Billing'),
      mapNetSuiteField('purchasecontract', 'Purchase Contract', 'select', 'Billing', 'Billing', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/purchase-contracts', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('total', 'Total', 'currency', 'Billing', 'Billing'),
      mapNetSuiteField('unbilledorders', 'Unbilled Orders', 'currency', 'Billing', 'Billing'),
      mapNetSuiteField('intercostatus', 'Intercompany Status', 'select', 'Billing', 'Billing', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/intercompany-statuses', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('intercotransaction', 'Paired Transaction', 'select', 'Billing', 'Billing', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/transactions', method: 'GET', labelKey: 'name', valueKey: 'id' } }),

      // --- TAX DETAILS ---
      mapNetSuiteField('nexus', 'Nexus', 'select', 'Tax Details', 'Tax Details', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/nexuses', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('entitynexus', 'Nexus Reference', 'select', 'Tax Details', 'Tax Details', false, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/nexuses', method: 'GET', labelKey: 'name', valueKey: 'id' } }),

      // --- SYSTEM INFO ---
      mapNetSuiteField('status', 'Status', 'text', 'System Information', 'Main'),
      mapNetSuiteField('orderstatus', 'Order Status', 'text', 'System Information', 'Main'),
      mapNetSuiteField('source', 'Source', 'text', 'System Information', 'Main'),
      mapNetSuiteField('externalid', 'ExternalId', 'text', 'System Information', 'Main'),
      mapNetSuiteField('createddate', 'Created Date', 'datetime', 'System Information', 'Main'),
      mapNetSuiteField('lastmodifieddate', 'Last Modified Date', 'datetime', 'System Information', 'Main'),

      // --- ITEMS (SUBLIST) ---
      mapNetSuiteField('item', 'Item', 'select', 'Line Items', 'Items', true, 'sublist', 'item', { type: 'api', apiConfig: { url: '/api/mock/transactions', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('quantity', 'Quantity', 'float', 'Line Items', 'Items', true, 'sublist', 'item'),
      mapNetSuiteField('units', 'Units', 'select', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('description', 'Description', 'text', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('rate', 'Rate', 'currency', 'Line Items', 'Items', true, 'sublist', 'item'),
      mapNetSuiteField('amount', 'Amount', 'currency', 'Line Items', 'Items', true, 'sublist', 'item'),
      mapNetSuiteField('taxcode', 'Tax Code', 'select', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('taxrate1', 'Tax Rate', 'percent', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('taxamount1', 'Tax Amount', 'currency', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('expectedreceivedate', 'Expected Receipt Date', 'date', 'Line Items', 'Items', false, 'sublist', 'item'),

      // --- EXPENSES (SUBLIST) ---
      mapNetSuiteField('category', 'Category', 'select', 'Expenses', 'Items', false, 'sublist', 'expense'),
      mapNetSuiteField('account', 'Account', 'select', 'Expenses', 'Items', true, 'sublist', 'expense', { type: 'api', apiConfig: { url: '/api/mock/departments', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('amount_expense', 'Amount', 'currency', 'Expenses', 'Items', true, 'sublist', 'expense'),
      mapNetSuiteField('memo_expense', 'Memo', 'text', 'Expenses', 'Items', false, 'sublist', 'expense'),
      mapNetSuiteField('department_expense', 'Department', 'select', 'Expenses', 'Items', false, 'sublist', 'expense', { type: 'api', apiConfig: { url: '/api/mock/departments', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('class_expense', 'Class', 'select', 'Expenses', 'Items', false, 'sublist', 'expense', { type: 'api', apiConfig: { url: '/api/mock/classifications', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('location_expense', 'Location', 'select', 'Expenses', 'Items', false, 'sublist', 'expense', { type: 'api', apiConfig: { url: '/api/mock/locations', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('customer_expense', 'Customer', 'select', 'Expenses', 'Items', false, 'sublist', 'expense', { type: 'api', apiConfig: { url: '/api/mock/customers', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('isbillable', 'Billable', 'checkbox', 'Expenses', 'Items', false, 'sublist', 'expense'),
    ] 
  },
  sales_order: { 
    name: 'Sales Order', 
    tabs: ['Main', 'Shipping', 'Billing', 'Items'], 
    fieldGroups: ['Primary Information', 'Classification', 'Shipping', 'Billing', 'Line Items'], 
    fields: [
      mapNetSuiteField('entity', 'Customer', 'select', 'Primary Information', 'Main', true, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/customers', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('trandate', 'Date', 'date', 'Primary Information', 'Main', true),
      mapNetSuiteField('tranid', 'Order #', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField('subsidiary', 'Subsidiary', 'select', 'Classification', 'Main', true, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/subsidiaries', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('item', 'Item', 'select', 'Line Items', 'Items', true, 'sublist', 'item', { type: 'api', apiConfig: { url: '/api/mock/transactions', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('quantity', 'Quantity', 'float', 'Line Items', 'Items', true, 'sublist', 'item'),
    ] 
  },
  accounts_payable: { 
    name: 'Accounts Payable', 
    tabs: ['Main', 'Expenses'], 
    fieldGroups: ['Primary Information', 'Expenses'], 
    fields: [
      mapNetSuiteField('entity', 'Vendor', 'select', 'Primary Information', 'Main', true, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/vendors', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('trandate', 'Date', 'date', 'Primary Information', 'Main', true),
      mapNetSuiteField('account', 'Account', 'select', 'Expenses', 'Expenses', true, 'sublist', 'expense', { type: 'api', apiConfig: { url: '/api/mock/departments', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('amount', 'Amount', 'currency', 'Expenses', 'Expenses', true, 'sublist', 'expense'),
    ] 
  },
  accounts_receivable: { 
    name: 'Accounts Receivable', 
    tabs: ['Main', 'Items'], 
    fieldGroups: ['Primary Information', 'Line Items'], 
    fields: [
      mapNetSuiteField('entity', 'Customer', 'select', 'Primary Information', 'Main', true, 'body', null, { type: 'api', apiConfig: { url: '/api/mock/customers', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
      mapNetSuiteField('trandate', 'Date', 'date', 'Primary Information', 'Main', true),
      mapNetSuiteField('item', 'Item', 'select', 'Line Items', 'Items', true, 'sublist', 'item', { type: 'api', apiConfig: { url: '/api/mock/transactions', method: 'GET', labelKey: 'name', valueKey: 'id' } }),
    ] 
  },
};

// Map backend form to frontend CustomForm
const mapBackendForm = (form: any): CustomForm => ({
  id: form.id,
  name: form.name,
  customerId: form.companyId,
  transactionType: form.transactionType,
  createdBy: form.createdBy,
  createdAt: form.createdAt,
  updatedAt: form.updatedAt,
  source: form.source || 'scratch',
  assignedTo: form.assignedTo || [],
  tabs: form.structure?.tabs?.map((t: any) => {
    const mapFields = (fields: any[]) => fields?.map((f: any) => ({
      id: f.fieldId,
      label: f.label,
      visible: f.visible,
      mandatory: f.mandatory,
      type: f.type || 'string',
      group: f.group,
      tab: f.tab,
      section: f.section || 'body',
      subSection: f.subSection,
      displayType: f.displayType || 'normal',
      checkBoxDefault: f.checkBoxDefault || 'default',
      layout: f.layout || { columnBreak: false, spaceBefore: false },
      dataSource: f.dataSource
    })) || [];

    return {
      id: t.id || Math.random().toString(36).substr(2, 5),
      name: t.name,
      itemSublist: mapFields(t.itemSublist),
      expenseSublist: mapFields(t.expenseSublist),
      fieldGroups: t.fieldGroups?.map((g: any) => ({
        id: g.id,
        name: g.name,
        fields: mapFields(g.fields)
      })) || []
    };
  }) || []
});

const mapFrontendStructure = (tabs: Tab[]) => ({
  tabs: tabs.map(t => {
    const mapFieldsToBackend = (fields: Field[]) => fields.map(f => ({
      fieldId: f.id,
      label: f.label,
      visible: f.visible,
      mandatory: f.mandatory,
      type: f.type,
      group: f.group,
      tab: f.tab,
      section: f.section,
      subSection: f.subSection,
      displayType: f.displayType,
      checkBoxDefault: f.checkBoxDefault,
      layout: f.layout,
      dataSource: f.dataSource
    }));

    return {
      id: t.id,
      name: t.name,
      visible: true,
      itemSublist: mapFieldsToBackend(t.itemSublist || []),
      expenseSublist: mapFieldsToBackend(t.expenseSublist || []),
      fieldGroups: t.fieldGroups.map(g => ({
        id: g.id,
        name: g.name,
        fields: mapFieldsToBackend(g.fields)
      }))
    };
  })
});

const generateTemplateFromCatalogue = (id: string, name: string, description: string, type: TransactionType) => {
  const catalogue = CATALOGUES[type];
  const tabs: Tab[] = catalogue.tabs.map(tabName => {
    const tab: Tab = {
      id: `tab_${tabName.replace(/\s+/g, '_').toLowerCase()}`,
      name: tabName,
      fieldGroups: catalogue.fieldGroups.map(groupName => {
        const fields = catalogue.fields.filter(f => f.tab === tabName && f.group === groupName && (!f.section || f.section === 'body'));
        if (fields.length === 0) return null;
        return {
          id: `group_${groupName.replace(/\s+/g, '_').toLowerCase()}`,
          name: groupName,
          fields: fields
        };
      }).filter(Boolean) as any[]
    };

    if (tabName === 'Items') {
      tab.itemSublist = catalogue.fields.filter(f => f.tab === tabName && f.section === 'sublist' && f.subSection === 'item');
      tab.expenseSublist = catalogue.fields.filter(f => f.tab === tabName && f.section === 'sublist' && f.subSection === 'expense');
    }

    return tab;
  }).filter(tab => tab.fieldGroups.length > 0 || (tab.itemSublist?.length || 0) > 0 || (tab.expenseSublist?.length || 0) > 0);

  return {
    id,
    name,
    description,
    transactionType: type,
    source: 'template',
    tags: ['Comprehensive', type.replace('_', ' ')],
    tabs
  };
};

const DEFAULT_TEMPLATES: any[] = [
  generateTemplateFromCatalogue('tpl_po_full', 'Comprehensive Purchase Order', 'Standard PO with all fields mapped for general procurement.', 'purchase_order'),
  generateTemplateFromCatalogue('tpl_so_full', 'Comprehensive Sales Order', 'Sales order with complete classification, billing, and shipping details.', 'sales_order'),
  generateTemplateFromCatalogue('tpl_ap_full', 'Comprehensive Accounts Payable', 'A/P template with full accounting and approval structure.', 'accounts_payable'),
  generateTemplateFromCatalogue('tpl_ar_full', 'Comprehensive Accounts Receivable', 'A/R template including full items and journal controls.', 'accounts_receivable'),
];

export const useStore = create<AppState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  users: [],
  forms: [],
  companies: [],
  templates: DEFAULT_TEMPLATES,
  submissions: [],
  currentForm: null,
  transactionType: 'purchase_order',
  catalogues: CATALOGUES,
  groupedCatalogues: {
    purchase_order: null,
    sales_order: null,
    accounts_payable: null,
    accounts_receivable: null
  },
  isLoading: false,
  error: null,
  activeTabId: '',
  selectedFieldId: null,

  login: async (email: string, password?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      if (password) params.append('password', password);
      
      const response = await api.post('auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const { access_token, user, role } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify({ ...user, role }));
      set({ user: { ...user, role }, isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Login failed', isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, forms: [], companies: [], users: [], submissions: [] });
    window.location.href = '/login';
  },

  restoreSession: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await api.get('auth/me');
      set({ user: response.data });
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (err) {
      get().logout();
    }
  },

  fetchCompanies: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('companies');
      set({ companies: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('users');
      set({ users: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchForms: async (companyId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = companyId ? { companyId } : {};
      const response = await api.get('forms', { params });
      set({ forms: response.data.map(mapBackendForm), isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMyForms: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('forms/my');
      console.log('Fetched My Forms:', response.data);
      set({ forms: response.data, isLoading: false });
    } catch (err: any) {
      console.error('Fetch My Forms Error:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMyFormDetails: async (formId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`forms/${formId}/my`);
      const form = mapBackendForm(response.data);
      set({ isLoading: false });
      return form;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  fetchSubmissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('submissions');
      set({ submissions: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createForm: async (name, companyId, transactionType, tabs) => {
    set({ isLoading: true, error: null });
    try {
      let formTabs = tabs || [];
      if (formTabs.length === 0) {
        formTabs = [{
          id: 'tab_general',
          name: 'General',
          fieldGroups: [{
            id: 'group_main',
            name: 'Primary Information',
            fields: []
          }]
        }];
      }
      const structure = mapFrontendStructure(formTabs);
      const response = await api.post('forms', {
        name,
        companyId,
        transactionType,
        structure,
        assignedTo: []
      });
      const newForm = mapBackendForm(response.data);
      set((state) => ({ 
        forms: [...state.forms, newForm], 
        currentForm: newForm, 
        activeTabId: newForm.tabs[0]?.id || '',
        selectedFieldId: null,
        isLoading: false 
      }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message;
      set({ error: msg, isLoading: false });
    }
  },

  updateForm: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const payload: any = {};
      if (updates.name) payload.name = updates.name;
      if (updates.tabs) payload.structure = mapFrontendStructure(updates.tabs);
      
      const response = await api.put(`forms/${id}`, payload);
      const updatedForm = mapBackendForm(response.data);
      set((state) => ({
        forms: state.forms.map(f => f.id === id ? updatedForm : f),
        currentForm: state.currentForm?.id === id ? updatedForm : state.currentForm,
        isLoading: false
      }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message;
      set({ error: msg, isLoading: false });
    }
  },

  deleteForm: async (id) => {
    try {
      await api.delete(`forms/${id}`);
      set((state) => ({ forms: state.forms.filter(f => f.id !== id) }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  cloneForm: async (id, targetCompanyId, newName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`forms/${id}/clone`, { 
        targetCompanyId, 
        newName: newName || 'Cloned Form' 
      });
      const clonedForm = mapBackendForm(response.data);
      set((state) => ({ forms: [...state.forms, clonedForm], isLoading: false }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  assignUsers: async (formId, userIds) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`forms/${formId}/assign`, { userIds });
      console.log(`Successfully assigned ${userIds.length} users to form ${formId}`);
      set((state) => ({
        forms: state.forms.map(f => f.id === formId ? { ...f, assignedTo: userIds } : f),
        isLoading: false
      }));
    } catch (err: any) {
      console.error('Assign Users Error:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  submitForm: async (formId, values) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`forms/${formId}/submit`, { values });
      set({ isLoading: false });
      // Clear forms to trigger refetch of status
      get().fetchMyForms();
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Submission failed', isLoading: false });
      throw err;
    }
  },

  retrySubmission: async (submissionId) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`submissions/${submissionId}/retry`);
      get().fetchSubmissions();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchCatalogue: async (type: TransactionType) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('catalogue', { params: { type } });
      
      const mappedFields: Field[] = response.data.map((f: any) => ({
        id: f.internalId,
        label: f.label,
        type: f.type,
        section: f.section || 'body',
        subSection: f.subSection,
        group: f.group || (f.isSystemField ? 'Standard Information' : 'Custom Fields'),
        tab: f.tab || 'Main',
        mandatory: f.required,
        visible: true,
        displayType: 'normal',
        checkBoxDefault: 'default',
        helpText: f.helpText || '',
        defaultValue: '',
        layout: { columnBreak: false, spaceBefore: false },
        isSystemField: f.isSystemField,
        dataSource: f.dataSource
      }));

      const newCatalogue: CatalogueData = {
        name: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        tabs: Array.from(new Set(mappedFields.map(f => f.tab))),
        fieldGroups: Array.from(new Set(mappedFields.map(f => f.group))),
        fields: mappedFields
      };

      set((state) => ({
        catalogues: { ...state.catalogues, [type]: newCatalogue },
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchGroupedCatalogue: async (type: TransactionType) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`catalogue/${type}/grouped`);
      
      // Response is { tabs: [ { name, groups: [{ name, fields: [] }], subSections: { item: [], expense: [] } } ] }
      const groupedData = response.data;
      
      // Map fields in grouped data to our internal Field type
      const mapField = (f: any): Field => ({
        id: f.internalId,
        label: f.label,
        type: f.type,
        section: f.section,
        subSection: f.subSection,
        group: f.group,
        tab: f.tab,
        mandatory: f.required,
        visible: true,
        displayType: 'normal',
        checkBoxDefault: 'default',
        helpText: f.helpText || '',
        defaultValue: '',
        layout: { columnBreak: false, spaceBefore: false },
        isSystemField: f.isSystemField,
        dataSource: f.dataSource
      });

      groupedData.tabs = groupedData.tabs.map((tab: any) => ({
        ...tab,
        groups: tab.groups.map((group: any) => ({
          ...group,
          fields: group.fields.map(mapField)
        })),
        subSections: Object.fromEntries(
          Object.entries(tab.subSections).map(([key, fields]: [string, any]) => [key, fields.map(mapField)])
        )
      }));

      set((state) => ({
        groupedCatalogues: { ...state.groupedCatalogues, [type]: groupedData },
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setActiveTabId: (id: string) => set({ activeTabId: id }),
  setSelectedFieldId: (id: string | null) => set({ selectedFieldId: id }),

  setCurrentForm: (form) => set({ 
    currentForm: form, 
    activeTabId: form?.tabs[0]?.id || '',
    selectedFieldId: null 
  }),
  addAllFields: () => {
    const { currentForm, catalogues } = get();
    if (!currentForm) return;

    const catalogue = catalogues[currentForm.transactionType];
    if (!catalogue) return;

    let newTabs = [...currentForm.tabs];

    catalogue.fields.forEach(field => {
      // Check if already added
      const isAlreadyAdded = newTabs.some(t => 
        t.fieldGroups.some(g => g.fields.some(f => f.id === field.id)) ||
        t.itemSublist?.some(f => f.id === field.id) ||
        t.expenseSublist?.some(f => f.id === field.id)
      );

      if (!isAlreadyAdded) {
        // Hierarchical logic
        let targetTab = newTabs.find(t => t.name === field.tab);
        if (!targetTab) {
          targetTab = {
            id: `tab_${Math.random().toString(36).substr(2, 5)}`,
            name: field.tab,
            fieldGroups: [],
            itemSublist: [],
            expenseSublist: []
          };
          newTabs.push(targetTab);
        }

        if (field.section === 'body') {
          // Find or create the group within the tab
          let targetGroup = targetTab.fieldGroups.find(g => g.name === field.group);
          if (!targetGroup) {
            targetGroup = {
              id: `group_${Math.random().toString(36).substr(2, 5)}`,
              name: field.group,
              fields: []
            };
            targetTab.fieldGroups.push(targetGroup);
          }
          targetGroup.fields.push({ ...field });
        } else if (field.section === 'sublist') {
          if (field.subSection === 'item') {
            if (!targetTab.itemSublist) targetTab.itemSublist = [];
            targetTab.itemSublist.push({ ...field });
          } else if (field.subSection === 'expense') {
            if (!targetTab.expenseSublist) targetTab.expenseSublist = [];
            targetTab.expenseSublist.push({ ...field });
          }
        }
      }
    });

    set({ currentForm: { ...currentForm, tabs: newTabs } });
  },

  setTransactionType: (type) => set({ transactionType: type, currentForm: null }),
  updateCurrentForm: (updates) => {
    const { currentForm } = get();
    if (currentForm) {
      set({ currentForm: { ...currentForm, ...updates } });
    }
  },

  toggleField: (field: Field) => {
    const { currentForm } = get();
    if (!currentForm) return;

    const isAlreadyAdded = currentForm.tabs.some(t => 
      t.fieldGroups.some(g => g.fields.some(f => f.id === field.id)) ||
      t.itemSublist?.some(f => f.id === field.id) ||
      t.expenseSublist?.some(f => f.id === field.id)
    );

    let newTabs = [...currentForm.tabs];

    if (isAlreadyAdded) {
      newTabs = newTabs.map(tab => ({
        ...tab,
        fieldGroups: tab.fieldGroups.map(group => ({
          ...group,
          fields: group.fields.filter(f => f.id !== field.id)
        })),
        itemSublist: tab.itemSublist?.filter(f => f.id !== field.id),
        expenseSublist: tab.expenseSublist?.filter(f => f.id !== field.id)
      }));
    } else {
      // Find or create the correct tab
      let targetTab = newTabs.find(t => t.name === field.tab);
      if (!targetTab) {
        targetTab = {
          id: `tab_${Math.random().toString(36).substr(2, 5)}`,
          name: field.tab,
          fieldGroups: [],
          itemSublist: [],
          expenseSublist: []
        };
        newTabs.push(targetTab);
      }

      if (field.section === 'body') {
        // Find or create the group within the tab
        let targetGroup = targetTab.fieldGroups.find(g => g.name === field.group);
        if (!targetGroup) {
          targetGroup = {
            id: `group_${Math.random().toString(36).substr(2, 5)}`,
            name: field.group,
            fields: []
          };
          targetTab.fieldGroups.push(targetGroup);
        }
        targetGroup.fields.push({ ...field });
      } else if (field.section === 'sublist') {
        if (field.subSection === 'item') {
          if (!targetTab.itemSublist) targetTab.itemSublist = [];
          targetTab.itemSublist.push({ ...field });
        } else if (field.subSection === 'expense') {
          if (!targetTab.expenseSublist) targetTab.expenseSublist = [];
          targetTab.expenseSublist.push({ ...field });
        }
      }
    }

    set({ currentForm: { ...currentForm, tabs: newTabs } });
  },

  addCompany: async (name) => {
    try {
      await api.post('companies', { name });
      get().fetchCompanies();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteCompany: async (id) => {
    try {
      await api.delete(`companies/${id}`);
      get().fetchCompanies();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addUser: async (userData) => {
    try {
      await api.post('users', userData);
      get().fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message;
      set({ error: msg });
      throw new Error(msg);
    }
  },

  deleteUser: async (id) => {
    try {
      await api.delete(`users/${id}`);
      get().fetchUsers();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  assignForm: async (formId, userIds) => {
    try {
      await api.put(`forms/${formId}/assign`, { userIds });
      get().fetchForms();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchAssignedUsers: async (formId) => {
    try {
      const response = await api.get(`forms/${formId}/assigned-users`);
      return response.data;
    } catch (err: any) {
      set({ error: err.message });
      return [];
    }
  },

  fetchFormById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`forms/${id}`);
      set({ currentForm: mapBackendForm(response.data), isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));
