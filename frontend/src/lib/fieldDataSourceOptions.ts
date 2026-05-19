/**
 * Form builder: which datasource presets are valid per NetSuite field id.
 * Keeps master-data integrations scoped to the fields they belong to.
 */
import {
  isAccountFieldId,
  isItemLineFieldId,
  isCustomerFieldId,
  isClassFieldId,
  isDepartmentFieldId,
  isHsnFetchFieldId,
  isLocationFieldId,
  isTaxNatureFieldId,
} from './netsuiteMasterData';

export type DataSourceTypeOption =
  | 'static'
  | 'api'
  | 'netsuite_dynamic'
  | 'netsuite_currency'
  | 'netsuite_hsn'
  | 'netsuite_employees'
  | 'netsuite_location'
  | 'netsuite_tax_nature_live'
  | 'netsuite_department'
  | 'netsuite_class_live'
  | 'netsuite_account_live'
  | 'netsuite_item_live'
  | 'netsuite_vendor_live'
  | 'netsuite_customer_live';

export function isEmployeesApiUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const p = url
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/^api\//, '');
  return p === 'netsuite/employees' || p.endsWith('/netsuite/employees');
}

function isHsnRelatedFieldId(fieldId: string): boolean {
  return isHsnFetchFieldId(fieldId);
}

/** Dropdown options shown in PropertiesPanel for this field id. */
export function getDataSourceOptionsForField(fieldId: string): {
  label: string;
  value: DataSourceTypeOption;
}[] {
  const id = fieldId.toLowerCase();

  if (id === 'employee' || id === 'nextapprover') {
    return [
      { label: 'Static', value: 'static' },
      { label: 'NetSuite Employees', value: 'netsuite_employees' },
    ];
  }

  if (id === 'currency') {
    return [
      { label: 'Static', value: 'static' },
      { label: 'NetSuite Currency', value: 'netsuite_currency' },
    ];
  }

  if (isHsnRelatedFieldId(id)) {
    return [
      { label: 'Static', value: 'static' },
      { label: 'NetSuite HSN Codes', value: 'netsuite_hsn' },
    ];
  }

  if (isLocationFieldId(id)) {
    return [
      { label: 'Static', value: 'static' },
      { label: 'NetSuite Locations', value: 'netsuite_location' },
    ];
  }

  if (isTaxNatureFieldId(id)) {
    return [
      { label: 'Static', value: 'static' },
      { label: 'NetSuite India Tax Nature', value: 'netsuite_tax_nature_live' },
    ];
  }

  if (isDepartmentFieldId(id)) {
    return [
      { label: 'Static', value: 'static' },
      { label: 'NetSuite Departments', value: 'netsuite_department' },
    ];
  }

  if (isClassFieldId(id)) {
    return [
      { label: 'Static', value: 'static' },
      { label: 'NetSuite Classes', value: 'netsuite_class_live' },
    ];
  }

  if (isAccountFieldId(id)) {
    return [
      { label: 'Static', value: 'static' },
      { label: 'NetSuite Accounts', value: 'netsuite_account_live' },
    ];
  }

  if (isItemLineFieldId(id)) {
    return [
      { label: 'Static', value: 'static' },
      { label: 'NetSuite Items', value: 'netsuite_item_live' },
    ];
  }

  if (id === 'customer_expense' || id === 'customer') {
    return [
      { label: 'Static', value: 'static' },
      { label: 'NetSuite Customers', value: 'netsuite_customer_live' },
    ];
  }

  if (id === 'entity') {
    return [
      { label: 'Static', value: 'static' },
      { label: 'NetSuite Customers', value: 'netsuite_customer_live' },
      { label: 'NetSuite Vendors', value: 'netsuite_vendor_live' },
      { label: 'NetSuite Connector (dynamic)', value: 'netsuite_dynamic' },
      { label: 'API (legacy)', value: 'api' },
    ];
  }

  return [
    { label: 'Static', value: 'static' },
    { label: 'NetSuite Connector (dynamic)', value: 'netsuite_dynamic' },
    { label: 'API (legacy)', value: 'api' },
  ];
}

/** Map stored dataSource to the select value shown in the builder. */
export function resolveDataSourceSelectValue(ds: any): DataSourceTypeOption {
  if (!ds?.type) return 'static';
  const t = ds.type as string;
  if (t === 'netsuite_dynamic') {
    return 'netsuite_dynamic';
  }
  if (
    t === 'netsuite_currency' ||
    t === 'netsuite_hsn' ||
    t === 'netsuite_employees' ||
    t === 'netsuite_location' ||
    t === 'netsuite_tax_nature_live' ||
    t === 'netsuite_department' ||
    t === 'netsuite_class_live' ||
    t === 'netsuite_account_live' ||
    t === 'netsuite_item_live' ||
    t === 'netsuite_vendor_live' ||
    t === 'netsuite_customer_live' ||
    t === 'static'
  ) {
    return t as DataSourceTypeOption;
  }
  if (t === 'api' && isEmployeesApiUrl(ds.apiConfig?.url)) {
    return 'netsuite_employees';
  }
  return 'api';
}
