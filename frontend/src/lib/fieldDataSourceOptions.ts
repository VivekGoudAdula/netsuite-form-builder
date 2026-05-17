/**
 * Form builder: which datasource presets are valid per NetSuite field id.
 * Keeps master-data integrations scoped to the fields they belong to.
 */
import { isHsnLineFieldId, isLocationFieldId } from './netsuiteMasterData';

export type DataSourceTypeOption =
  | 'static'
  | 'api'
  | 'netsuite_currency'
  | 'netsuite_hsn'
  | 'netsuite_employees'
  | 'netsuite_location';

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
  return isHsnLineFieldId(fieldId);
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

  return [
    { label: 'Static', value: 'static' },
    { label: 'API', value: 'api' },
  ];
}

/** Map stored dataSource to the select value shown in the builder. */
export function resolveDataSourceSelectValue(ds: any): DataSourceTypeOption {
  if (!ds?.type) return 'static';
  const t = ds.type as string;
  if (
    t === 'netsuite_currency' ||
    t === 'netsuite_hsn' ||
    t === 'netsuite_employees' ||
    t === 'netsuite_location' ||
    t === 'static'
  ) {
    return t as DataSourceTypeOption;
  }
  if (t === 'api' && isEmployeesApiUrl(ds.apiConfig?.url)) {
    return 'netsuite_employees';
  }
  return 'api';
}
