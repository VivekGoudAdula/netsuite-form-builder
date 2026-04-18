import { create } from 'zustand';
import api from '../api/client';
import { AppState, CustomForm, Field, User, TransactionType, CatalogueData, Tab, Company, Submission } from '../types';

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
  tabs: form.structure?.tabs?.map((t: any) => ({
    id: t.id || Math.random().toString(36).substr(2, 5),
    name: t.name,
    fieldGroups: t.fieldGroups?.map((g: any) => ({
      id: g.id,
      name: g.name,
      fields: g.fields?.map((f: any) => ({
        id: f.fieldId,
        label: f.label,
        visible: f.visible,
        mandatory: f.mandatory,
        type: f.type || 'string',
        displayType: f.displayType || 'normal',
        checkBoxDefault: f.checkBoxDefault || 'default',
        layout: f.layout || { columnBreak: false, spaceBefore: false }
      }))
    }))
  })) || []
});

// Map frontend structure to backend
const mapFrontendStructure = (tabs: Tab[]) => ({
  tabs: tabs.map(t => ({
    name: t.name,
    visible: true,
    fieldGroups: t.fieldGroups.map(g => ({
      id: g.id,
      name: g.name,
      fields: g.fields.map(f => ({
        fieldId: f.id,
        label: f.label,
        visible: f.visible,
        mandatory: f.mandatory,
        displayType: f.displayType,
        checkBoxDefault: f.checkBoxDefault,
        layout: f.layout
      }))
    }))
  }))
});

const generateTemplateFromCatalogue = (id: string, name: string, description: string, type: TransactionType) => {
  const catalogue = CATALOGUES[type];
  const tabs: Tab[] = catalogue.tabs.map(tabName => {
    return {
      id: `tab_${tabName.replace(/\s+/g, '_').toLowerCase()}`,
      name: tabName,
      fieldGroups: catalogue.fieldGroups.map(groupName => {
        const fields = catalogue.fields.filter(f => f.tab === tabName && f.fieldGroup === groupName);
        if (fields.length === 0) return null;
        return {
          id: `group_${groupName.replace(/\s+/g, '_').toLowerCase()}`,
          name: groupName,
          fields: fields
        };
      }).filter(Boolean) as any
    };
  }).filter(tab => tab.fieldGroups.length > 0);

  return {
    id,
    name,
    description,
    transactionType: type,
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
  isLoading: false,
  error: null,

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
      set({ error: err.message, isLoading: false });
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
      set({ error: err.message, isLoading: false });
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

  setActiveTabId: (id: string) => set({ activeTabId: id }),
  setSelectedFieldId: (id: string | null) => set({ selectedFieldId: id }),

  setCurrentForm: (form) => set({ 
    currentForm: form, 
    activeTabId: form?.tabs[0]?.id || '',
    selectedFieldId: null 
  }),
  setTransactionType: (type) => set({ transactionType: type, currentForm: null }),
  updateCurrentForm: (updates) => {
    const { currentForm } = get();
    if (currentForm) {
      set({ currentForm: { ...currentForm, ...updates } });
    }
  },

  toggleField: (field: Field) => {
    const { currentForm, activeTabId } = get();
    if (!currentForm) return;

    const isAlreadyAdded = currentForm.tabs.some(t => 
      t.fieldGroups.some(g => g.fields.some(f => f.id === field.id))
    );

    let newTabs = [...currentForm.tabs];

    if (isAlreadyAdded) {
      newTabs = newTabs.map(tab => ({
        ...tab,
        fieldGroups: tab.fieldGroups.map(group => ({
          ...group,
          fields: group.fields.filter(f => f.id !== field.id)
        }))
      }));
    } else {
      // Find the active tab, or the first one, or the one matching field meta
      let targetTab = newTabs.find(t => t.id === activeTabId) || 
                      newTabs.find(t => t.name === field.tab) ||
                      newTabs[0];
      
      if (!targetTab) {
        targetTab = {
          id: `tab_${Math.random().toString(36).substr(2, 5)}`,
          name: field.tab || 'General',
          fieldGroups: []
        };
        newTabs.push(targetTab);
      }

      // Find the first group in the tab, or create one
      let targetGroup = targetTab.fieldGroups[0];
      if (!targetGroup) {
        targetGroup = {
          id: `group_${Math.random().toString(36).substr(2, 5)}`,
          name: field.fieldGroup || 'Primary Information',
          fields: []
        };
        targetTab.fieldGroups.push(targetGroup);
      }

      targetGroup.fields.push({ ...field });
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
      set({ error: err.message });
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
}));
