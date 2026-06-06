import { create } from 'zustand';
import api from '../api/client';
import { catalogueApi } from '../api/catalogue';
import {
  AppState,
  CustomForm,
  Field,
  User,
  TransactionType,
  CatalogueData,
  Tab,
  Company,
  Submission,
  HSNRow,
  HSNSyncSummary,
  LocationRow,
  LocationSyncSummary,
  TaxNatureOption,
  ClassOption,
  AccountOption,
  ItemOption,
  VendorOption,
  CustomerOption,
} from '../types';
import { getCurrencies, syncCurrencies as postSyncCurrencies } from '../services/currencyService';
import {
  fetchHSNCodes as getHSNCodesPage,
  searchHSNCodes as searchHSNCodesApi,
  syncHSNCodes as postSyncHSNCodes,
} from '../services/hsnService';
import {
  fetchLocations as getLocationsPage,
  searchLocations as searchLocationsApi,
  syncLocations as postSyncLocations,
} from '../services/locationService';
import {
  fetchTaxNature as getTaxNatureLive,
  searchTaxNature as searchTaxNatureApi,
} from '../services/taxNatureService';
import {
  fetchClasses as getClassesPage,
  searchClasses as searchClassesApi,
} from '../services/classService';
import {
  fetchAccounts as getAccountsPage,
  searchAccounts as searchAccountsApi,
} from '../services/accountService';
import {
  fetchItems as getItemsPage,
  searchItems as searchItemsApi,
} from '../services/itemService';
import {
  fetchVendors as getVendorsPage,
  searchVendors as searchVendorsApi,
  rowToVendorOption,
} from '../services/vendorService';
import { searchAccounts as searchAccountsForPrefetch } from '../services/accountService';
import { searchItems as searchItemsForPrefetch } from '../services/itemService';
import { searchVendors as searchVendorsForPrefetch } from '../services/vendorService';
import {
  fetchCustomers as getCustomersPage,
  searchCustomers as searchCustomersApi,
  searchCustomers as searchCustomersForPrefetch,
  rowToCustomerOption,
} from '../services/customerService';
import { prefetchMasterDataSelectOptions } from '../lib/masterDataOptionsCache';
import {
  clearAsyncSearchPrefetch,
  setPrefetchedAccountSearch,
  setPrefetchedItemSearch,
  setPrefetchedVendorSearch,
  setPrefetchedCustomerSearch,
} from '../lib/asyncSearchPrefetch';
import { clearMasterDataOptionsCache } from '../lib/masterDataOptionsCache';
import { isEmployeesApiUrl } from '../lib/fieldDataSourceOptions';
import {
  isDedicatedHsnFieldId,
  NETSUITE_HSN_DATA_SOURCE,
  NETSUITE_LOCATION_DATA_SOURCE,
  NETSUITE_TAX_NATURE_DATA_SOURCE,
  NETSUITE_DEPARTMENT_DATA_SOURCE,
  NETSUITE_CLASS_DATA_SOURCE,
  NETSUITE_ACCOUNT_DATA_SOURCE,
  NETSUITE_ITEM_DATA_SOURCE,
  NETSUITE_VENDOR_DATA_SOURCE,
  NETSUITE_CUSTOMER_DATA_SOURCE,
  NETSUITE_SUBSIDIARY_DATA_SOURCE,
  applyFormFieldDataSource,
  sortItemReceiptSublistFields,
  sortItemSublistFields,
} from '../lib/netsuiteMasterData';

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
    fieldGroups: ['Primary Information', 'Classification', 'Shipping', 'Billing', 'Tax Details', 'India Tax Information', 'System Information', 'Line Items', 'Expenses'], 
    fields: [
      // --- PRIMARY INFORMATION ---
      mapNetSuiteField('customform', 'Custom Form', 'select', 'Primary Information', 'Main', true, 'body', null),
      mapNetSuiteField(
        'entity',
        'Vendor',
        'select',
        'Primary Information',
        'Main',
        true,
        'body',
        null,
        { ...NETSUITE_VENDOR_DATA_SOURCE },
        'NetSuite vendor (live lookup)',
      ),
      mapNetSuiteField('otherrefnum', 'Vendor #', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField('employee', 'Employee', 'select', 'Primary Information', 'Main', false, 'body', null, {
        type: 'netsuite_employees',
        apiConfig: { url: 'netsuite/employees', method: 'GET', labelKey: 'label', valueKey: 'value' },
      }),
      mapNetSuiteField('trandate', 'Date', 'date', 'Primary Information', 'Main', true),
      mapNetSuiteField('tranid', 'PO #', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField('duedate', 'Receive By', 'date', 'Primary Information', 'Main'),
      mapNetSuiteField('memo', 'Memo', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField('approvalstatus', 'Approval Status', 'select', 'Primary Information', 'Main', false, 'body', null, { type: 'static', options: [{ label: 'Pending Approval', value: '1' }, { label: 'Approved', value: '2' }, { label: 'Rejected', value: '3' }] }),
      mapNetSuiteField('nextapprover', 'Next Approver', 'select', 'Primary Information', 'Main', false, 'body', null, {
        type: 'netsuite_employees',
        apiConfig: { url: 'netsuite/employees', method: 'GET', labelKey: 'label', valueKey: 'value' },
      }),
      mapNetSuiteField('supervisorapproval', 'Supervisor Approval', 'checkbox', 'Primary Information', 'Main'),
      mapNetSuiteField('message', 'Vendor Message', 'textarea', 'Primary Information', 'Main'),
      mapNetSuiteField('email', 'Email', 'emails', 'Primary Information', 'Main'),
      mapNetSuiteField('tobeemailed', 'To Be E-mailed', 'checkbox', 'Primary Information', 'Main'),
      mapNetSuiteField('tobefaxed', 'To Be Faxed', 'checkbox', 'Primary Information', 'Main'),
      mapNetSuiteField('tobeprinted', 'To Be Printed', 'checkbox', 'Primary Information', 'Main'),
      mapNetSuiteField('createdfrom', 'Created From', 'select', 'Primary Information', 'Main', false, 'body', null),

      // --- CLASSIFICATION ---
      mapNetSuiteField('subsidiary', 'Subsidiary', 'select', 'Classification', 'Main', true, 'body', null, { ...NETSUITE_SUBSIDIARY_DATA_SOURCE }),
      mapNetSuiteField(
        'department',
        'Department',
        'select',
        'Classification',
        'Main',
        false,
        'body',
        null,
        { ...NETSUITE_DEPARTMENT_DATA_SOURCE },
        'NetSuite department (Classification)',
      ),
      mapNetSuiteField(
        'class',
        'Class',
        'select',
        'Classification',
        'Main',
        false,
        'body',
        null,
        { ...NETSUITE_CLASS_DATA_SOURCE },
        'NetSuite class (Classification)',
      ),
      mapNetSuiteField(
        'location',
        'Location',
        'select',
        'Classification',
        'Main',
        false,
        'body',
        null,
        { ...NETSUITE_LOCATION_DATA_SOURCE },
        'NetSuite location (body)',
      ),

      // --- SHIPPING ---
      mapNetSuiteField('shipdate', 'Ship Date', 'date', 'Shipping', 'Shipping', false),
      mapNetSuiteField('shipmethod', 'Ship Via', 'select', 'Shipping', 'Shipping', false, 'body', null),
      mapNetSuiteField('shipto', 'Ship To', 'select', 'Shipping', 'Shipping', false, 'body', null),
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
      mapNetSuiteField('terms', 'Terms', 'select', 'Billing', 'Billing', false, 'body', null),
      mapNetSuiteField('billaddress', 'Billing Address', 'address', 'Billing', 'Billing'),
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
      mapNetSuiteField('currency', 'Currency', 'select', 'Billing', 'Billing', true, 'body', null, {
        type: 'netsuite_currency',
        apiConfig: {
          url: 'currencies/',
          method: 'GET',
          labelKey: 'name',
          valueKey: 'internalId',
        },
      }),
      mapNetSuiteField('currencyname', 'Currency Name', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('currencysymbol', 'Currency Symbol', 'text', 'Billing', 'Billing'),
      mapNetSuiteField('exchangerate', 'Exchange Rate', 'currency2', 'Billing', 'Billing', true),
      mapNetSuiteField('availablevendorcredit', 'Available Vendor Credit', 'currency', 'Billing', 'Billing'),
      mapNetSuiteField('balance', 'Balance', 'currency', 'Billing', 'Billing'),
      mapNetSuiteField('isbasecurrency', 'Base Currency', 'checkbox', 'Billing', 'Billing'),
      mapNetSuiteField('purchasecontract', 'Purchase Contract', 'select', 'Billing', 'Billing', false, 'body', null),
      mapNetSuiteField('total', 'Total', 'currency', 'Billing', 'Billing'),
      mapNetSuiteField('unbilledorders', 'Unbilled Orders', 'currency', 'Billing', 'Billing'),
      mapNetSuiteField('intercostatus', 'Intercompany Status', 'select', 'Billing', 'Billing', false, 'body', null),
      mapNetSuiteField('intercotransaction', 'Paired Transaction', 'select', 'Billing', 'Billing', false, 'body', null),

      // --- TAX DETAILS ---
      mapNetSuiteField('nexus', 'Nexus', 'select', 'Tax Details', 'Tax Details', false, 'body', null),
      mapNetSuiteField('entitynexus', 'Nexus Reference', 'select', 'Tax Details', 'Tax Details', false, 'body', null),
      mapNetSuiteField(
        'taxnature',
        'India Tax Nature',
        'select',
        'India Tax Information',
        'Tax Details',
        false,
        'body',
        null,
        { ...NETSUITE_TAX_NATURE_DATA_SOURCE },
        'India GST tax nature classification from NetSuite',
      ),

      // --- SYSTEM INFO ---
      mapNetSuiteField('status', 'Status', 'select', 'System Information', 'Main', false, 'body', null, { type: 'static', options: [{ label: 'Pending Approval', value: '1' }, { label: 'Approved', value: '2' }, { label: 'Rejected', value: '3' }] }),
      mapNetSuiteField('statusRef', 'Status Reference', 'select', 'System Information', 'Main', false, 'body', null, { type: 'static', options: [{ label: 'Pending Approval', value: '1' }, { label: 'Approved', value: '2' }, { label: 'Rejected', value: '3' }] }),
      mapNetSuiteField('orderstatus', 'Order Status', 'text', 'System Information', 'Main'),
      mapNetSuiteField('source', 'Source', 'text', 'System Information', 'Main'),
      mapNetSuiteField('externalid', 'ExternalId', 'text', 'System Information', 'Main'),
      mapNetSuiteField('createddate', 'Created Date', 'datetime', 'System Information', 'Main'),
      mapNetSuiteField('lastmodifieddate', 'Last Modified Date', 'datetime', 'System Information', 'Main'),

      // --- ITEMS (SUBLIST) — Tax Code uses live NetSuite HSN master lookup ---
      mapNetSuiteField(
        'item',
        'Item',
        'select',
        'Line Items',
        'Items',
        true,
        'sublist',
        'item',
        { ...NETSUITE_ITEM_DATA_SOURCE },
        'NetSuite item (live lookup)',
      ),
      mapNetSuiteField('quantity', 'Quantity', 'float', 'Line Items', 'Items', true, 'sublist', 'item'),
      mapNetSuiteField('rate', 'Rate', 'currency', 'Line Items', 'Items', true, 'sublist', 'item'),
      mapNetSuiteField(
        'taxcode',
        'Tax Code',
        'select',
        'Line Items',
        'Items',
        false,
        'sublist',
        'item',
        { ...NETSUITE_HSN_DATA_SOURCE },
        'HSN / tax classification from NetSuite (live lookup)',
      ),
      mapNetSuiteField('amount', 'Amount', 'currency', 'Line Items', 'Items', true, 'sublist', 'item'),
      mapNetSuiteField('units', 'Units', 'select', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('description', 'Description', 'text', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('gstrate', 'GST Rate', 'text', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('taxrate1', 'Tax Rate', 'percent', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('taxamount1', 'Tax Amount', 'currency', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('expectedreceivedate', 'Expected Receipt Date', 'date', 'Line Items', 'Items', false, 'sublist', 'item'),

      // --- EXPENSES (SUBLIST) ---
      mapNetSuiteField('category', 'Category', 'select', 'Expenses', 'Items', false, 'sublist', 'expense'),
      mapNetSuiteField(
        'account',
        'Account',
        'select',
        'Expenses',
        'Items',
        true,
        'sublist',
        'expense',
        { ...NETSUITE_ACCOUNT_DATA_SOURCE },
        'NetSuite GL account (expense line)',
      ),
      mapNetSuiteField('amount_expense', 'Amount', 'currency', 'Expenses', 'Items', true, 'sublist', 'expense'),
      mapNetSuiteField('memo_expense', 'Memo', 'text', 'Expenses', 'Items', false, 'sublist', 'expense'),
      mapNetSuiteField(
        'department_expense',
        'Department',
        'select',
        'Expenses',
        'Items',
        false,
        'sublist',
        'expense',
        { ...NETSUITE_DEPARTMENT_DATA_SOURCE },
        'NetSuite department (expense line)',
      ),
      mapNetSuiteField(
        'class_expense',
        'Class',
        'select',
        'Expenses',
        'Items',
        false,
        'sublist',
        'expense',
        { ...NETSUITE_CLASS_DATA_SOURCE },
        'NetSuite class (expense line)',
      ),
      mapNetSuiteField(
        'location_expense',
        'Location',
        'select',
        'Expenses',
        'Items',
        false,
        'sublist',
        'expense',
        { ...NETSUITE_LOCATION_DATA_SOURCE },
        'NetSuite location (expense line)',
      ),
      mapNetSuiteField(
        'customer_expense',
        'Customer',
        'select',
        'Expenses',
        'Items',
        false,
        'sublist',
        'expense',
        { ...NETSUITE_CUSTOMER_DATA_SOURCE },
        'NetSuite customer (live lookup)',
      ),
      mapNetSuiteField('isbillable', 'Billable', 'checkbox', 'Expenses', 'Items', false, 'sublist', 'expense'),
    ] 
  },
  sales_order: { 
    name: 'Sales Order', 
    tabs: ['Main', 'Shipping', 'Billing', 'Items'], 
    fieldGroups: ['Primary Information', 'Classification', 'Shipping', 'Billing', 'Line Items'], 
    fields: [
      mapNetSuiteField(
        'entity',
        'Customer',
        'select',
        'Primary Information',
        'Main',
        true,
        'body',
        null,
        { ...NETSUITE_CUSTOMER_DATA_SOURCE },
        'NetSuite customer (live lookup)',
      ),
      mapNetSuiteField('trandate', 'Date', 'date', 'Primary Information', 'Main', true),
      mapNetSuiteField('tranid', 'Order #', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField('email', 'Email', 'emails', 'Primary Information', 'Main'),
      mapNetSuiteField('subsidiary', 'Subsidiary', 'select', 'Classification', 'Main', true, 'body', null, { ...NETSUITE_SUBSIDIARY_DATA_SOURCE }),
      mapNetSuiteField('shipaddress', 'Shipping Address', 'address', 'Shipping', 'Shipping'),
      mapNetSuiteField('billaddress', 'Billing Address', 'address', 'Billing', 'Billing'),
      mapNetSuiteField(
        'item',
        'Item',
        'select',
        'Line Items',
        'Items',
        true,
        'sublist',
        'item',
        { ...NETSUITE_ITEM_DATA_SOURCE },
        'NetSuite item (live lookup)',
      ),
      mapNetSuiteField('quantity', 'Quantity', 'float', 'Line Items', 'Items', true, 'sublist', 'item'),
    ] 
  },
  accounts_payable: { 
    name: 'Accounts Payable', 
    tabs: ['Main', 'Expenses'], 
    fieldGroups: ['Primary Information', 'Expenses'], 
    fields: [
      mapNetSuiteField(
        'entity',
        'Vendor',
        'select',
        'Primary Information',
        'Main',
        true,
        'body',
        null,
        { ...NETSUITE_VENDOR_DATA_SOURCE },
        'NetSuite vendor (live lookup)',
      ),
      mapNetSuiteField('trandate', 'Date', 'date', 'Primary Information', 'Main', true),
      mapNetSuiteField('account', 'Account', 'select', 'Expenses', 'Expenses', true, 'sublist', 'expense'),
      mapNetSuiteField('amount', 'Amount', 'currency', 'Expenses', 'Expenses', true, 'sublist', 'expense'),
    ] 
  },
  accounts_receivable: { 
    name: 'Accounts Receivable', 
    tabs: ['Main', 'Items'], 
    fieldGroups: ['Primary Information', 'Line Items'], 
    fields: [
      mapNetSuiteField(
        'entity',
        'Customer',
        'select',
        'Primary Information',
        'Main',
        true,
        'body',
        null,
        { ...NETSUITE_CUSTOMER_DATA_SOURCE },
        'NetSuite customer (live lookup)',
      ),
      mapNetSuiteField('trandate', 'Date', 'date', 'Primary Information', 'Main', true),
      mapNetSuiteField('email', 'Email', 'emails', 'Primary Information', 'Main'),
      mapNetSuiteField('subsidiary', 'Subsidiary', 'select', 'Classification', 'Main', true, 'body', null, { ...NETSUITE_SUBSIDIARY_DATA_SOURCE }),
      mapNetSuiteField(
        'item',
        'Item',
        'select',
        'Line Items',
        'Items',
        true,
        'sublist',
        'item',
        { ...NETSUITE_ITEM_DATA_SOURCE },
        'NetSuite item (live lookup)',
      ),
    ] 
  },
  item_receipt: {
    name: 'Item Receipt',
    tabs: ['Main', 'Items'],
    fieldGroups: ['Primary Information'],
    fields: [
      mapNetSuiteField('trandate', 'Date', 'date', 'Primary Information', 'Main', true),
      mapNetSuiteField('entity', 'Vendor', 'select', 'Primary Information', 'Main', true, 'body', null, { ...NETSUITE_VENDOR_DATA_SOURCE }),
      mapNetSuiteField('custbody_rg_po_start_date', 'PO Start Date', 'date', 'Primary Information', 'Main'),
      mapNetSuiteField('custbody_rg_po_end_date', 'PO End Date', 'date', 'Primary Information', 'Main'),
      mapNetSuiteField('custbody_rg_po_number', 'PO Number', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField('subsidiary', 'Subsidiary', 'select', 'Primary Information', 'Main', true, 'body', null, { ...NETSUITE_SUBSIDIARY_DATA_SOURCE }),
      mapNetSuiteField('location', 'To Location', 'select', 'Primary Information', 'Main', true, 'body', null, { ...NETSUITE_LOCATION_DATA_SOURCE }),
      mapNetSuiteField('currency', 'Currency', 'select', 'Primary Information', 'Main', true, 'body', null, {
        type: 'netsuite_currency',
        apiConfig: { url: 'currencies/', method: 'GET', labelKey: 'name', valueKey: 'internalId' },
      }),
      mapNetSuiteField('custbody_rg_prm_invoice_num', 'PRM Invoice Number', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField('custbody_rg_prm_total_amount', 'PRM Total Amount', 'currency', 'Primary Information', 'Main'),
      mapNetSuiteField('createdfrom', 'Created From', 'select', 'Primary Information', 'Main', true, 'body', null, {
        type: 'api',
        apiConfig: { url: 'purchase-orders/search', method: 'GET', labelKey: 'displayLabel', valueKey: 'id' },
      }),
      mapNetSuiteField('postingperiod', 'Posting Period', 'select', 'Primary Information', 'Main', true),
      mapNetSuiteField('custbody_podate', 'PO Date', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField('item', 'Item', 'select', 'Line Items', 'Items', true, 'sublist', 'item', { ...NETSUITE_ITEM_DATA_SOURCE }),
      mapNetSuiteField('quantity', 'Quantity', 'float', 'Line Items', 'Items', true, 'sublist', 'item'),
      mapNetSuiteField('rate', 'Rate', 'currency', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('amount', 'Amount', 'currency', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('location', 'Location', 'select', 'Line Items', 'Items', false, 'sublist', 'item', { ...NETSUITE_LOCATION_DATA_SOURCE }),
      mapNetSuiteField('department', 'Department', 'select', 'Line Items', 'Items', false, 'sublist', 'item', { ...NETSUITE_DEPARTMENT_DATA_SOURCE }),
      mapNetSuiteField('class', 'Class', 'select', 'Line Items', 'Items', false, 'sublist', 'item', { ...NETSUITE_CLASS_DATA_SOURCE }),
      mapNetSuiteField('description', 'Description', 'text', 'Line Items', 'Items', false, 'sublist', 'item'),
    ],
  },
  vendor_bill: {
    name: 'Vendor Bill',
    tabs: ['Main', 'Items'],
    fieldGroups: ['Primary Information', 'Classification', 'Line Items'],
    fields: [
      mapNetSuiteField('customform', 'Form', 'select', 'Primary Information', 'Main', true, 'body', null),
      mapNetSuiteField(
        'entity',
        'Vendor',
        'select',
        'Primary Information',
        'Main',
        true,
        'body',
        null,
        { ...NETSUITE_VENDOR_DATA_SOURCE },
        'NetSuite vendor (live lookup)',
      ),
      mapNetSuiteField('tranid', 'Invoice Number', 'text', 'Primary Information', 'Main'),
      mapNetSuiteField(
        'account',
        'Account',
        'select',
        'Primary Information',
        'Main',
        true,
        'body',
        null,
        { ...NETSUITE_ACCOUNT_DATA_SOURCE },
        'NetSuite GL account',
      ),
      mapNetSuiteField('usertotal', 'Amount', 'currency', 'Primary Information', 'Main', true, 'body', null),
      mapNetSuiteField('currency', 'Currency', 'select', 'Primary Information', 'Main', true, 'body', null, {
        type: 'netsuite_currency',
        apiConfig: { url: 'currencies/', method: 'GET', labelKey: 'name', valueKey: 'internalId' },
      }),
      mapNetSuiteField('exchangerate', 'Exchange Rate', 'number', 'Primary Information', 'Main', true, 'body', null),
      mapNetSuiteField('terms', 'Terms', 'select', 'Primary Information', 'Main', false, 'body', null),
      mapNetSuiteField('duedate', 'Due Date', 'date', 'Primary Information', 'Main', true, 'body', null),
      mapNetSuiteField('trandate', 'Date', 'date', 'Primary Information', 'Main', true, 'body', null),
      mapNetSuiteField('postingperiod', 'Posting Period', 'select', 'Primary Information', 'Main', false, 'body', null),
      mapNetSuiteField('memo', 'Memo', 'textarea', 'Primary Information', 'Main', false, 'body', null),
      mapNetSuiteField('approvalstatus', 'Approval Status', 'select', 'Primary Information', 'Main', false, 'body', null, {
        type: 'static',
        options: [
          { label: 'Pending Approval', value: '1' },
          { label: 'Approved', value: '2' },
          { label: 'Rejected', value: '3' },
        ],
      }),
      mapNetSuiteField('subsidiary', 'Subsidiary', 'select', 'Classification', 'Main', true, 'body', null, { ...NETSUITE_SUBSIDIARY_DATA_SOURCE }),
      mapNetSuiteField(
        'location',
        'Location',
        'select',
        'Classification',
        'Main',
        false,
        'body',
        null,
        { ...NETSUITE_LOCATION_DATA_SOURCE },
      ),
      mapNetSuiteField(
        'class',
        'Class',
        'select',
        'Classification',
        'Main',
        false,
        'body',
        null,
        { ...NETSUITE_CLASS_DATA_SOURCE },
      ),
      mapNetSuiteField('custbody_in_gst_pos', 'Place Of Supply', 'select', 'Classification', 'Main', false, 'body', null),
      mapNetSuiteField(
        'item',
        'Item',
        'select',
        'Line Items',
        'Items',
        true,
        'sublist',
        'item',
        { ...NETSUITE_ITEM_DATA_SOURCE },
      ),
      mapNetSuiteField('description', 'Description', 'text', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('quantity', 'Quantity', 'float', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('rate', 'Rate', 'currency', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField('amount', 'Amount', 'currency', 'Line Items', 'Items', false, 'sublist', 'item'),
      mapNetSuiteField(
        'department',
        'Department',
        'select',
        'Line Items',
        'Items',
        false,
        'sublist',
        'item',
        { ...NETSUITE_DEPARTMENT_DATA_SOURCE },
      ),
      mapNetSuiteField(
        'class',
        'Class',
        'select',
        'Line Items',
        'Items',
        false,
        'sublist',
        'item',
        { ...NETSUITE_CLASS_DATA_SOURCE },
      ),
      mapNetSuiteField(
        'location',
        'Location',
        'select',
        'Line Items',
        'Items',
        false,
        'sublist',
        'item',
        { ...NETSUITE_LOCATION_DATA_SOURCE },
      ),
    ],
  },
};

function normalizeFieldDataSource(ds: any): any {
  if (!ds) return undefined;
  if (ds.type === 'netsuite_subsidiary') {
    return {
      type: 'netsuite_subsidiary',
      endpoint: ds.endpoint || 'subsidiaries/',
      apiConfig: {
        method: 'GET',
        labelKey: 'name',
        valueKey: 'internalId',
        searchKey: 'name',
        ...ds.apiConfig,
        url: ds.apiConfig?.url || 'subsidiaries/',
      },
    };
  }
  if (ds.type === 'netsuite_currency') {
    return {
      type: 'netsuite_currency',
      apiConfig: ds.apiConfig || {
        url: 'currencies/',
        method: 'GET',
        labelKey: 'name',
        valueKey: 'internalId',
      },
    };
  }
  if (ds.type === 'netsuite_hsn') {
    return {
      type: 'netsuite_hsn',
      endpoint: ds.endpoint || 'hsn-codes/search',
      apiConfig: {
        method: 'GET',
        labelKey: 'name',
        valueKey: 'internalId',
        searchKey: 'hsncode',
        ...ds.apiConfig,
        url: ds.apiConfig?.url || 'hsn-codes/search',
      },
    };
  }
  if (ds.type === 'netsuite_employees') {
    return {
      type: 'netsuite_employees',
      apiConfig: {
        method: 'GET',
        labelKey: 'label',
        valueKey: 'value',
        ...ds.apiConfig,
        url: 'netsuite/employees',
      },
    };
  }
  if (ds.type === 'netsuite_location') {
    return {
      type: 'netsuite_location',
      endpoint: ds.endpoint || 'locations/search',
      apiConfig: {
        method: 'GET',
        labelKey: 'name',
        valueKey: 'internalId',
        searchKey: 'name',
        ...ds.apiConfig,
        url: ds.apiConfig?.url || 'locations/search',
      },
    };
  }
  if (ds.type === 'netsuite_tax_nature_live') {
    return {
      type: 'netsuite_tax_nature_live',
      endpoint: ds.endpoint || 'tax-nature/search',
      apiConfig: {
        method: 'GET',
        labelKey: 'name',
        valueKey: 'name',
        searchKey: 'name',
        ...ds.apiConfig,
        url: ds.apiConfig?.url || 'tax-nature/search',
      },
    };
  }
  if (ds.type === 'netsuite_department') {
    return {
      type: 'netsuite_department',
      endpoint: ds.endpoint || 'departments/',
      apiConfig: {
        method: 'GET',
        labelKey: 'name',
        valueKey: 'internalId',
        searchKey: 'name',
        ...ds.apiConfig,
        url: ds.apiConfig?.url || 'departments/',
      },
    };
  }
  if (ds.type === 'netsuite_class_live') {
    return {
      type: 'netsuite_class_live',
      endpoint: ds.endpoint || 'classes/',
      apiConfig: {
        method: 'GET',
        labelKey: 'name',
        valueKey: 'internalId',
        searchKey: 'name',
        ...ds.apiConfig,
        url: ds.apiConfig?.url || 'classes/',
      },
    };
  }
  if (ds.type === 'netsuite_account_live') {
    return {
      type: 'netsuite_account_live',
      endpoint: ds.endpoint || 'accounts/search',
      apiConfig: {
        method: 'GET',
        labelKey: 'name',
        valueKey: 'internalId',
        searchKey: 'name',
        ...ds.apiConfig,
        url: ds.apiConfig?.url || 'accounts/search',
      },
    };
  }
  if (ds.type === 'netsuite_item_live') {
    return {
      type: 'netsuite_item_live',
      endpoint: ds.endpoint || 'items/search',
      apiConfig: {
        method: 'GET',
        labelKey: 'displayName',
        valueKey: 'internalId',
        searchKey: 'displayName',
        ...ds.apiConfig,
        url: ds.apiConfig?.url || 'items/search',
      },
    };
  }
  if (ds.type === 'netsuite_vendor_live') {
    return {
      type: 'netsuite_vendor_live',
      endpoint: ds.endpoint || 'vendors/search',
      apiConfig: {
        method: 'GET',
        labelKey: 'displayName',
        valueKey: 'internalId',
        searchKey: 'displayName',
        ...ds.apiConfig,
        url: ds.apiConfig?.url || 'vendors/search',
      },
    };
  }
  if (ds.type === 'netsuite_customer_live') {
    return {
      type: 'netsuite_customer_live',
      endpoint: ds.endpoint || 'customers/search',
      apiConfig: {
        method: 'GET',
        labelKey: 'displayName',
        valueKey: 'internalId',
        searchKey: 'displayName',
        ...ds.apiConfig,
        url: ds.apiConfig?.url || 'customers/search',
      },
    };
  }
  if (ds.type === 'api' && isEmployeesApiUrl(ds.apiConfig?.url)) {
    return {
      type: 'netsuite_employees',
      apiConfig: {
        method: 'GET',
        labelKey: ds.apiConfig?.labelKey || 'label',
        valueKey: ds.apiConfig?.valueKey || 'value',
        ...ds.apiConfig,
        url: 'netsuite/employees',
      },
    };
  }
  return ds;
}

/** Drop duplicate legacy HSN column when Tax Code already carries HSN lookup. */
function normalizePoItemSublist(tabs: Tab[], transactionType: TransactionType): Tab[] {
  if (transactionType !== 'purchase_order') return tabs;
  return tabs.map(tab => {
    if (tab.name !== 'Items' || !tab.itemSublist?.length) return tab;
    const hasTaxCode = tab.itemSublist.some(f => f.id.toLowerCase() === 'taxcode');
    const list = tab.itemSublist
      .filter(f => !(hasTaxCode && isDedicatedHsnFieldId(f.id)))
      .map(f => applyFormFieldDataSource(f));
    return { ...tab, itemSublist: sortItemSublistFields(list) };
  });
}

// Map backend form to frontend CustomForm
const mapBackendForm = (form: any): CustomForm => {
  const tabs =
    form.structure?.tabs?.map((t: any) => {
      const mapFields = (fields: any[]): Field[] =>
        fields?.map((f: any) =>
          applyFormFieldDataSource({
            id: f.fieldId || f.id,
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
            helpText: f.helpText || '',
            defaultValue: f.defaultValue || '',
            layout: f.layout || { columnBreak: false, spaceBefore: false },
            dataSource: normalizeFieldDataSource(f.dataSource),
          }),
        ) || [];

      return {
        id: t.id || Math.random().toString(36).substr(2, 5),
        name: t.name,
        itemSublist: sortItemSublistFields(mapFields(t.itemSublist)),
        expenseSublist: mapFields(t.expenseSublist),
        fieldGroups:
          t.fieldGroups?.map((g: any) => ({
            id: g.id,
            name: g.name,
            fields: mapFields(g.fields),
          })) || [],
      };
    }) || [];

  return {
  id: form.id,
  name: form.name,
  customerId: form.companyId,
  transactionType: form.transactionType,
  createdBy: form.createdBy,
  createdAt: form.createdAt,
  updatedAt: form.updatedAt,
  source: form.source || 'scratch',
  assignedTo: form.assignedTo || [],
  currentLevel: form.currentLevel,
  status: form.status,
  tabs: normalizePoItemSublist(tabs, form.transactionType),
};
};

const mapBackendUser = (u: any): User => ({
  id: u.id || u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  companyId: u.companyId,
  companyName: u.companyName,
  jobTitle: u.jobTitle,
  employeeId: u.empId, // This fixes the N/A issue
  isActive: u.isActive !== undefined ? u.isActive : true,
  createdAt: u.createdAt
});

const mapBackendSubmission = (
  s: any,
  forms: CustomForm[],
  _companies: Company[],
  users: User[],
): Submission => {
  const form = forms.find(f => f.id === s.formId);
  const user = users.find(u => u.id === s.userId);
  return {
    id: s.id || String(s._id),
    formId: s.formId,
    userId: s.userId,
    userName: user?.name ?? s.userName,
    formName: form?.name ?? s.formName,
    companyId: s.companyId,
    status: s.status,
    currentLevel: s.currentLevel,
    approvals: s.approvals,
    submittedAt: s.submittedAt,
    netsuiteAt: s.netsuiteAt,
    netsuiteId: s.netsuiteId,
    errorMessage: s.errorMessage,
  };
};

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
      const itemFields = catalogue.fields.filter(
        f => f.tab === tabName && f.section === 'sublist' && f.subSection === 'item',
      );
      tab.itemSublist =
        type === 'item_receipt' || type === 'vendor_bill'
          ? sortItemReceiptSublistFields(itemFields)
          : sortItemSublistFields(itemFields);
      if (type !== 'vendor_bill') {
        tab.expenseSublist = catalogue.fields.filter(
          f => f.tab === tabName && f.section === 'sublist' && f.subSection === 'expense',
        );
      }
    }
    if (tabName === 'Expenses') {
      tab.expenseSublist = catalogue.fields.filter(
        f => f.tab === tabName && f.section === 'sublist' && f.subSection === 'expense',
      );
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
  generateTemplateFromCatalogue('tpl_ir_full', 'Comprehensive Item Receipt', 'Item receipt template with created-from PO and receiving grid.', 'item_receipt'),
  generateTemplateFromCatalogue('tpl_vb_full', 'Comprehensive Vendor Bill', 'Vendor bill with item and expense lines, classification, and approval flow.', 'vendor_bill'),
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
    accounts_receivable: null,
    item_receipt: null,
    vendor_bill: null,
  },
  currencies: [],
  loadingCurrencies: false,
  hsnCodes: [] as HSNRow[],
  hsnListCount: 0,
  hsnListPage: 1,
  hsnListLimit: 50,
  loadingHSN: false,
  locations: [] as LocationRow[],
  locationListCount: 0,
  locationListPage: 1,
  locationListLimit: 50,
  loadingLocations: false,
  taxNatureOptions: [] as TaxNatureOption[],
  loadingTaxNature: false,
  classOptions: [] as ClassOption[],
  loadingClasses: false,
  accountOptions: [] as AccountOption[],
  accountListCount: 0,
  accountListPage: 1,
  accountListLimit: 50,
  loadingAccounts: false,
  itemOptions: [] as ItemOption[],
  itemListCount: 0,
  itemListPage: 1,
  itemListLimit: 50,
  loadingItems: false,
  vendorOptions: [] as VendorOption[],
  vendorListCount: 0,
  vendorListPage: 1,
  vendorListLimit: 50,
  loadingVendors: false,
  customerOptions: [] as CustomerOption[],
  customerListCount: 0,
  customerListPage: 1,
  customerListLimit: 50,
  loadingCustomers: false,
  masterDataPrefetching: false,
  masterDataPrefetchDone: false,
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
      void get().prefetchMasterData();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Login failed', isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearMasterDataOptionsCache();
    clearAsyncSearchPrefetch();
    set({
      user: null,
      forms: [],
      companies: [],
      users: [],
      submissions: [],
      currencies: [],
      hsnCodes: [],
      hsnListCount: 0,
      hsnListPage: 1,
      hsnListLimit: 50,
      locations: [],
      locationListCount: 0,
      locationListPage: 1,
      locationListLimit: 50,
      accountOptions: [],
      accountListCount: 0,
      itemOptions: [],
      itemListCount: 0,
      vendorOptions: [],
      vendorListCount: 0,
      customerOptions: [],
      customerListCount: 0,
      classOptions: [],
      taxNatureOptions: [],
      masterDataPrefetchDone: false,
      masterDataPrefetching: false,
    });
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

  prefetchMasterData: async () => {
    if (get().masterDataPrefetching || get().masterDataPrefetchDone) return;
    if (!localStorage.getItem('token')) return;
    set({ masterDataPrefetching: true, error: null });

    const pause = (ms = 500) => new Promise<void>(r => setTimeout(r, ms));

    try {
      // Native <select> caches (each step may call one NetSuite RESTlet on the backend).
      await prefetchMasterDataSelectOptions();

      // Large async comboboxes: one search per type (avoids duplicate fetch + search).
      const accountRes = await searchAccountsForPrefetch('', 1, 50);
      await pause();
      const itemRes = await searchItemsForPrefetch('', 1, 50);
      await pause();
      const vendorRes = await searchVendorsForPrefetch('', 1, 50);
      await pause();
      const customerRes = await searchCustomersForPrefetch('', 1, 50);

      if (accountRes.success !== false) {
        const rows = accountRes.data ?? [];
        setPrefetchedAccountSearch('', 1, rows, accountRes.count ?? rows.length);
        set({
          accountOptions: rows.map(row => ({
            internalId: row.internalId,
            number: row.number,
            name: row.name,
            type: row.type ?? '',
            generalratetype: row.generalratetype ?? '',
            cashflowratetype: row.cashflowratetype ?? '',
          })),
          accountListCount: accountRes.count ?? rows.length,
          accountListPage: 1,
        });
      }
      if (itemRes.success !== false) {
        const rows = itemRes.data ?? [];
        setPrefetchedItemSearch('', 1, rows, itemRes.count ?? rows.length);
        set({
          itemOptions: rows.map(row => ({
            internalId: row.internalId,
            displayName: row.displayName,
            itemCategory: row.itemCategory ?? '',
            department: row.department ?? '',
            className: row.className ?? '',
            location: row.location ?? '',
            hsnCode: row.hsnCode ?? '',
            gstRate: row.gstRate ?? '',
          })),
          itemListCount: itemRes.count ?? rows.length,
          itemListPage: 1,
        });
      }
      if (vendorRes.success !== false) {
        const rows = vendorRes.data ?? [];
        setPrefetchedVendorSearch('', 1, rows, vendorRes.count ?? rows.length);
        set({
          vendorOptions: rows.map(rowToVendorOption),
          vendorListCount: vendorRes.count ?? rows.length,
          vendorListPage: 1,
        });
      }
      if (customerRes.success !== false) {
        const rows = customerRes.data ?? [];
        setPrefetchedCustomerSearch('', 1, rows, customerRes.count ?? rows.length);
        set({
          customerOptions: rows.map(rowToCustomerOption),
          customerListCount: customerRes.count ?? rows.length,
          customerListPage: 1,
        });
      }

      set({ masterDataPrefetchDone: true });
    } catch (err) {
      console.warn('Master data prefetch incomplete', err);
      set({ masterDataPrefetchDone: true });
    } finally {
      set({ masterDataPrefetching: false });
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
      set({ users: response.data.map(mapBackendUser), isLoading: false });
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

  fetchMyForms: async (transactionType?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = transactionType ? { transactionType } : {};
      const response = await api.get('forms/my', { params });
      console.log('Fetched My Forms:', response.data);
      set({ forms: response.data, isLoading: false });
    } catch (err: any) {
      console.error('Fetch My Forms Error:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMySubmissions: async (transactionType?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = transactionType ? { transactionType } : {};
      const response = await api.get('submissions/my', { params });
      set({ submissions: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMyStats: async (transactionType?: string) => {
    try {
      const params = transactionType ? { transactionType } : {};
      const response = await api.get('submissions/my/stats', { params });
      return response.data;
    } catch (err: any) {
      console.error('Fetch Stats Error:', err);
      return null;
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
      const { forms, companies, users } = get();
      const response = await api.get('submissions');
      set({ 
        submissions: response.data.map((s: any) => mapBackendSubmission(s, forms, companies, users)), 
        isLoading: false 
      });
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
      const response = await api.post(`forms/${formId}/submit`, { values });
      set({ isLoading: false });
      // Clear forms to trigger refetch of status
      get().fetchMyForms();
      return response.data;
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
        dataSource: normalizeFieldDataSource(f.dataSource)
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
        dataSource: normalizeFieldDataSource(f.dataSource)
      });

      groupedData.tabs = groupedData.tabs.map((tab: any) => ({
        ...tab,
        groups: tab.groups.map((group: any) => ({
          ...group,
          fields: group.fields.map(mapField)
        })),
        subSections: Object.fromEntries(
          Object.entries(tab.subSections).map(([key, fields]: [string, any]) => [
            key,
            key === 'item' ? sortItemSublistFields(fields.map(mapField)) : fields.map(mapField),
          ]),
        ),
      }));

      set((state) => ({
        groupedCatalogues: { ...state.groupedCatalogues, [type]: groupedData },
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchCurrencies: async (opts?: { includeInactive?: boolean }) => {
    set({ loadingCurrencies: true, error: null });
    try {
      const data = await getCurrencies(Boolean(opts?.includeInactive));
      set({ currencies: data, loadingCurrencies: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || err.message,
        loadingCurrencies: false,
      });
    }
  },

  syncCurrencies: async () => {
    set({ loadingCurrencies: true, error: null });
    try {
      const summary = await postSyncCurrencies();
      await get().fetchCurrencies();
      set({ loadingCurrencies: false });
      return summary;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || err.message,
        loadingCurrencies: false,
      });
      throw err;
    }
  },

  fetchHSN: async (opts?: {
    page?: number;
    limit?: number;
    search?: string;
    includeInactive?: boolean;
  }) => {
    set({ loadingHSN: true, error: null });
    try {
      const lim = opts?.limit ?? get().hsnListLimit ?? 50;
      const pg = opts?.page ?? get().hsnListPage ?? 1;
      const data = await getHSNCodesPage({
        page: pg,
        limit: lim,
        search: opts?.search,
        includeInactive: Boolean(opts?.includeInactive),
      });
      set({
        hsnCodes: data.data,
        hsnListCount: data.count,
        hsnListPage: data.page,
        hsnListLimit: data.limit,
        loadingHSN: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || err.message,
        loadingHSN: false,
      });
    }
  },

  searchHSN: async (q: string, limit = 50) => {
    try {
      return await searchHSNCodesApi(q, limit);
    } catch {
      return [];
    }
  },

  syncHSN: async () => {
    set({ loadingHSN: true, error: null });
    try {
      const summary = await postSyncHSNCodes();
      await get().fetchHSN({
        page: 1,
        limit: get().hsnListLimit || 50,
      });
      set({ loadingHSN: false });
      return summary;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || err.message,
        loadingHSN: false,
      });
      throw err;
    }
  },

  fetchLocations: async (opts?: {
    page?: number;
    limit?: number;
    search?: string;
    includeInactive?: boolean;
    subsidiary?: string;
  }) => {
    set({ loadingLocations: true, error: null });
    try {
      const lim = opts?.limit ?? get().locationListLimit ?? 50;
      const pg = opts?.page ?? get().locationListPage ?? 1;
      const data = await getLocationsPage({
        page: pg,
        limit: lim,
        search: opts?.search,
        includeInactive: Boolean(opts?.includeInactive),
        subsidiary: opts?.subsidiary,
      });
      set({
        locations: data.data,
        locationListCount: data.count,
        locationListPage: data.page,
        locationListLimit: data.limit,
        loadingLocations: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || err.message,
        loadingLocations: false,
      });
    }
  },

  searchLocations: async (q: string, limit = 50, subsidiary?: string) => {
    try {
      return await searchLocationsApi(q, limit, subsidiary);
    } catch {
      return [];
    }
  },

  syncLocations: async () => {
    set({ loadingLocations: true, error: null });
    try {
      const summary = await postSyncLocations();
      await get().fetchLocations({
        page: 1,
        limit: get().locationListLimit || 50,
      });
      set({ loadingLocations: false });
      return summary;
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || err.message,
        loadingLocations: false,
      });
      throw err;
    }
  },

  fetchTaxNature: async () => {
    set({ loadingTaxNature: true, error: null });
    try {
      const res = await getTaxNatureLive();
      set({
        taxNatureOptions: res.success ? res.data ?? [] : [],
        loadingTaxNature: false,
        error: res.success ? null : res.message || 'Unable to fetch tax nature data',
      });
    } catch (err: any) {
      set({
        taxNatureOptions: [],
        error: err.response?.data?.detail || err.message,
        loadingTaxNature: false,
      });
    }
  },

  searchTaxNature: async (q: string) => {
    try {
      return await searchTaxNatureApi(q);
    } catch {
      return [];
    }
  },

  fetchClasses: async (opts) => {
    set({ loadingClasses: true, error: null });
    try {
      const res = await getClassesPage({
        page: opts?.page ?? 1,
        limit: opts?.limit ?? 200,
        search: opts?.search,
        subsidiary: opts?.subsidiary,
      });
      const options: ClassOption[] = (res.data ?? []).map(row => ({
        internalId: row.internalId,
        name: row.name,
        subsidiary: row.subsidiary ?? '',
      }));
      set({
        classOptions: res.success ? options : [],
        loadingClasses: false,
        error: res.success ? null : 'Unable to fetch classes',
      });
    } catch (err: any) {
      set({
        classOptions: [],
        error: err.response?.data?.detail || err.message,
        loadingClasses: false,
      });
    }
  },

  searchClasses: async (q: string, limit = 50, subsidiary?: string) => {
    try {
      const rows = await searchClassesApi(q, limit, subsidiary);
      return rows.map(row => ({
        internalId: row.internalId,
        name: row.name,
        subsidiary: row.subsidiary ?? '',
      }));
    } catch {
      return [];
    }
  },

  fetchAccounts: async (opts) => {
    set({ loadingAccounts: true, error: null });
    try {
      const page = opts?.page ?? 1;
      const limit = opts?.limit ?? 50;
      const res = await getAccountsPage({ page, limit, search: opts?.search });
      const options: AccountOption[] = (res.data ?? []).map(row => ({
        internalId: row.internalId,
        number: row.number,
        name: row.name,
        type: row.type ?? '',
        generalratetype: row.generalratetype ?? '',
        cashflowratetype: row.cashflowratetype ?? '',
      }));
      set({
        accountOptions: res.success ? options : [],
        accountListCount: res.count ?? 0,
        accountListPage: page,
        accountListLimit: limit,
        loadingAccounts: false,
        error: res.success ? null : res.message || 'Unable to fetch account data',
      });
    } catch (err: any) {
      set({
        accountOptions: [],
        accountListCount: 0,
        error: err.response?.data?.detail || err.message,
        loadingAccounts: false,
      });
    }
  },

  searchAccounts: async (q: string, page = 1, limit = 50) => {
    try {
      const res = await searchAccountsApi(q, page, limit);
      return (res.data ?? []).map(row => ({
        internalId: row.internalId,
        number: row.number,
        name: row.name,
        type: row.type ?? '',
        generalratetype: row.generalratetype ?? '',
        cashflowratetype: row.cashflowratetype ?? '',
      }));
    } catch {
      return [];
    }
  },

  fetchItems: async (opts) => {
    set({ loadingItems: true, error: null });
    try {
      const page = opts?.page ?? 1;
      const limit = opts?.limit ?? 50;
      const res = await getItemsPage({ page, limit, search: opts?.search });
      const options: ItemOption[] = (res.data ?? []).map(row => ({
        internalId: row.internalId,
        displayName: row.displayName,
        itemCategory: row.itemCategory ?? '',
        department: row.department ?? '',
        className: row.className ?? '',
        location: row.location ?? '',
        hsnCode: row.hsnCode ?? '',
        gstRate: row.gstRate ?? '',
      }));
      set({
        itemOptions: res.success ? options : [],
        itemListCount: res.count ?? 0,
        itemListPage: page,
        itemListLimit: limit,
        loadingItems: false,
        error: res.success ? null : res.message || 'Unable to fetch item data',
      });
    } catch (err: any) {
      set({
        itemOptions: [],
        itemListCount: 0,
        error: err.response?.data?.detail || err.message,
        loadingItems: false,
      });
    }
  },

  searchItems: async (q: string, page = 1, limit = 50) => {
    try {
      const res = await searchItemsApi(q, page, limit);
      return (res.data ?? []).map(row => ({
        internalId: row.internalId,
        displayName: row.displayName,
        itemCategory: row.itemCategory ?? '',
        department: row.department ?? '',
        className: row.className ?? '',
        location: row.location ?? '',
        hsnCode: row.hsnCode ?? '',
        gstRate: row.gstRate ?? '',
      }));
    } catch {
      return [];
    }
  },

  fetchVendors: async (opts) => {
    set({ loadingVendors: true, error: null });
    try {
      const page = opts?.page ?? 1;
      const limit = opts?.limit ?? 50;
      const res = await getVendorsPage({ page, limit, search: opts?.search });
      const options: VendorOption[] = (res.data ?? []).map(rowToVendorOption);
      set({
        vendorOptions: res.success ? options : [],
        vendorListCount: res.count ?? 0,
        vendorListPage: page,
        vendorListLimit: limit,
        loadingVendors: false,
        error: res.success ? null : res.message || 'Unable to fetch vendor data',
      });
    } catch (err: any) {
      set({
        vendorOptions: [],
        vendorListCount: 0,
        error: err.response?.data?.detail || err.message,
        loadingVendors: false,
      });
    }
  },

  searchVendors: async (q: string, page = 1, limit = 50) => {
    try {
      const res = await searchVendorsApi(q, page, limit);
      return (res.data ?? []).map(rowToVendorOption);
    } catch {
      return [];
    }
  },

  fetchCustomers: async (opts) => {
    set({ loadingCustomers: true, error: null });
    try {
      const page = opts?.page ?? 1;
      const limit = opts?.limit ?? 50;
      const res = await getCustomersPage({ page, limit, search: opts?.search });
      const options: CustomerOption[] = (res.data ?? []).map(rowToCustomerOption);
      set({
        customerOptions: res.success ? options : [],
        customerListCount: res.count ?? 0,
        customerListPage: page,
        customerListLimit: limit,
        loadingCustomers: false,
        error: res.success ? null : res.message || 'Unable to fetch customer data',
      });
    } catch (err: any) {
      set({
        customerOptions: [],
        customerListCount: 0,
        error: err.response?.data?.detail || err.message,
        loadingCustomers: false,
      });
    }
  },

  searchCustomers: async (q: string, page = 1, limit = 50) => {
    try {
      const res = await searchCustomersApi(q, page, limit);
      return (res.data ?? []).map(rowToCustomerOption);
    } catch {
      return [];
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
          targetGroup.fields.push(applyFormFieldDataSource({ ...field }));
        } else if (field.section === 'sublist') {
          if (field.subSection === 'item') {
            if (!targetTab.itemSublist) targetTab.itemSublist = [];
            targetTab.itemSublist.push(applyFormFieldDataSource({ ...field }));
            targetTab.itemSublist = sortItemSublistFields(targetTab.itemSublist);
          } else if (field.subSection === 'expense') {
            if (!targetTab.expenseSublist) targetTab.expenseSublist = [];
            targetTab.expenseSublist.push(applyFormFieldDataSource({ ...field }));
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
        targetGroup.fields.push(applyFormFieldDataSource({ ...field }));
      } else if (field.section === 'sublist') {
        if (field.subSection === 'item') {
          if (!targetTab.itemSublist) targetTab.itemSublist = [];
          targetTab.itemSublist.push(applyFormFieldDataSource({ ...field }));
          targetTab.itemSublist = sortItemSublistFields(targetTab.itemSublist);
        } else if (field.subSection === 'expense') {
          if (!targetTab.expenseSublist) targetTab.expenseSublist = [];
          targetTab.expenseSublist.push(applyFormFieldDataSource({ ...field }));
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
    set({ isLoading: true, error: null });
    try {
      await api.post('users', userData);
      get().fetchUsers();
      set({ isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message;
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  updateUserStatus: async (userId, isActive) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`users/${userId}/status`, { isActive });
      get().fetchUsers();
      set({ isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message;
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`users/${id}`);
      get().fetchUsers();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.put('users/change-password', { oldPassword, newPassword });
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message;
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('auth/forgot-password', { email });
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message, isLoading: false });
      return false;
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('auth/reset-password', { token, newPassword });
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message, isLoading: false });
      return false;
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

  fetchPendingApprovals: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('submissions/pending-approvals');
      set({ isLoading: false });
      return response.data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return [];
    }
  },

  approveSubmission: async (submissionId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`workflows/${submissionId}/approve`);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message, isLoading: false });
      throw err;
    }
  },

  rejectSubmission: async (submissionId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`workflows/${submissionId}/reject`);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || err.message, isLoading: false });
      throw err;
    }
  },
}));
