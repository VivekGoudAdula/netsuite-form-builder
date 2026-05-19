import type { DataSource, Field } from '../types';

/** NetSuite HSN REST search — used on PO line items only. */
export const NETSUITE_HSN_DATA_SOURCE: DataSource = {
  type: 'netsuite_hsn',
  endpoint: 'hsn-codes/',
  apiConfig: {
    url: 'hsn-codes/',
    method: 'GET',
    labelKey: 'name',
    valueKey: 'internalId',
    searchKey: 'hsncode',
  },
};

/** PO line Tax Code column — live HSN master lookup (NetSuite RESTlet). */
export const PO_TAX_CODE_HSN_FIELD_ID = 'taxcode';

/** Legacy dedicated HSN columns (older forms); not added to new PO templates. */
export const LEGACY_HSN_LINE_FIELD_IDS = ['hsncode', 'custcol_hsn_code', 'hsn_code'] as const;

/** Field ids that use NetSuite HSN async search (Tax Code + legacy HSN columns). */
export const HSN_FETCH_FIELD_IDS = [PO_TAX_CODE_HSN_FIELD_ID, ...LEGACY_HSN_LINE_FIELD_IDS] as const;

export function isHsnFetchFieldId(fieldId: string): boolean {
  const id = fieldId.toLowerCase();
  if (HSN_FETCH_FIELD_IDS.includes(id as (typeof HSN_FETCH_FIELD_IDS)[number])) {
    return true;
  }
  return id.includes('hsncode') || id.includes('hsn_code') || id.endsWith('_hsn');
}

/** @deprecated Use isHsnFetchFieldId */
export function isHsnLineFieldId(fieldId: string): boolean {
  return isHsnFetchFieldId(fieldId);
}

/** Dedicated HSN column (not Tax Code) — used for legacy form cleanup / validation. */
export function isDedicatedHsnFieldId(fieldId: string): boolean {
  const id = fieldId.toLowerCase();
  if (id === PO_TAX_CODE_HSN_FIELD_ID) return false;
  return isHsnFetchFieldId(fieldId);
}

/** Preferred PO line column order (tax code / HSN after item). */
export const PO_ITEM_SUBLIST_FIELD_ORDER: string[] = [
  'item',
  'quantity',
  'rate',
  'taxcode',
  'gstrate',
  'amount',
  'units',
  'description',
  'taxrate1',
  'taxamount1',
  'expectedreceivedate',
];

export function sortItemSublistFields(fields: Field[]): Field[] {
  const rank = (id: string) => {
    const i = PO_ITEM_SUBLIST_FIELD_ORDER.indexOf(id.toLowerCase());
    return i === -1 ? 999 : i;
  };
  return [...fields].sort((a, b) => rank(a.id) - rank(b.id) || a.label.localeCompare(b.label));
}

export function formatHsnOptionLabel(row: {
  hsncode?: string;
  hsndescription?: string;
  name?: string;
}): string {
  const code = String(row.hsncode ?? '').trim();
  const desc = String(row.hsndescription ?? row.name ?? '').trim();
  if (code && desc) return `${code} - ${desc}`;
  if (code) return code;
  return desc || 'Unknown';
}

/** NetSuite Location REST search — PO body, expense lines, shipping/billing location fields. */
export const NETSUITE_LOCATION_DATA_SOURCE: DataSource = {
  type: 'netsuite_location',
  endpoint: 'locations/',
  apiConfig: {
    url: 'locations/',
    method: 'GET',
    labelKey: 'name',
    valueKey: 'internalId',
    searchKey: 'name',
  },
};

export const LOCATION_FIELD_IDS = [
  'location',
  'location_expense',
  'shippinglocation',
  'billinglocation',
] as const;

export function isLocationFieldId(fieldId: string): boolean {
  const id = fieldId.toLowerCase();
  if (LOCATION_FIELD_IDS.includes(id as (typeof LOCATION_FIELD_IDS)[number])) {
    return true;
  }
  if (id.endsWith('_location') && !id.includes('geolocation')) return true;
  return id === 'ship_location' || id === 'bill_location';
}

const MASTER_SELECT_LABEL_MAX = 72;
const MASTER_SELECT_SUBSIDIARY_MAX = 36;

function truncateSelectLabel(text: string, max = MASTER_SELECT_LABEL_MAX): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** NetSuite often returns every subsidiary on one row — keep the first for display only. */
function compactSubsidiaryForLabel(subsidiary: string): string {
  let sub = subsidiary.trim();
  if (!sub) return '';
  if (sub.includes(',')) sub = sub.split(',')[0].trim();
  return truncateSelectLabel(sub, MASTER_SELECT_SUBSIDIARY_MAX);
}

function formatNameSubsidiarySelectLabel(row: {
  name?: string;
  subsidiary?: string;
  internalId?: string;
}): string {
  const name = String(row.name ?? '').trim();
  const iid = String(row.internalId ?? '').trim();
  const sub = compactSubsidiaryForLabel(String(row.subsidiary ?? ''));
  if (!name) return truncateSelectLabel(sub || iid || 'Unknown');
  if (sub) return truncateSelectLabel(`${name} — ${sub}`);
  if (iid && !name.includes(iid)) return truncateSelectLabel(`${name} (${iid})`);
  return truncateSelectLabel(name);
}

function formatNameSubsidiarySelectTitle(row: {
  name?: string;
  subsidiary?: string;
  internalId?: string;
}): string {
  const name = String(row.name ?? '').trim();
  const sub = String(row.subsidiary ?? '').trim();
  const iid = String(row.internalId ?? '').trim();
  if (name && sub) return truncateSelectLabel(`${name} (${sub})`, 240);
  if (name && iid) return `${name} (${iid})`;
  return name || sub || iid || 'Unknown';
}

export function formatLocationOptionLabel(row: {
  name?: string;
  subsidiary?: string;
  internalId?: string;
}): string {
  return formatNameSubsidiarySelectLabel(row);
}

export function formatLocationOptionTitle(row: {
  name?: string;
  subsidiary?: string;
  internalId?: string;
}): string {
  return formatNameSubsidiarySelectTitle(row);
}

/** Ensure PO location fields use NetSuite master data (fixes legacy forms saved without dataSource). */
export function applyLocationFieldDataSource(field: Field): Field {
  if (!isLocationFieldId(field.id)) return field;
  if (field.dataSource?.type === 'netsuite_location') return field;
  return {
    ...field,
    dataSource: { ...NETSUITE_LOCATION_DATA_SOURCE },
  };
}

/** NetSuite India Tax Nature — live lookup (value = label = name). */
export const NETSUITE_TAX_NATURE_DATA_SOURCE: DataSource = {
  type: 'netsuite_tax_nature_live',
  endpoint: 'tax-nature/live',
  apiConfig: {
    url: 'tax-nature/live',
    method: 'GET',
    labelKey: 'name',
    valueKey: 'name',
    searchKey: 'name',
  },
};

export const TAX_NATURE_FIELD_IDS = ['taxnature', 'custbody_tax_nature'] as const;

export function isTaxNatureFieldId(fieldId: string): boolean {
  const id = fieldId.toLowerCase();
  return (
    TAX_NATURE_FIELD_IDS.includes(id as (typeof TAX_NATURE_FIELD_IDS)[number]) ||
    id.includes('tax_nature') ||
    id === 'taxnature'
  );
}

export function applyTaxNatureFieldDataSource(field: Field): Field {
  if (!isTaxNatureFieldId(field.id)) return field;
  if (field.dataSource?.type === 'netsuite_tax_nature_live') return field;
  return {
    ...field,
    dataSource: { ...NETSUITE_TAX_NATURE_DATA_SOURCE },
  };
}

/** Ensure Tax Code (and legacy HSN columns) use live NetSuite HSN lookup. */
export function applyHsnFieldDataSource(field: Field): Field {
  if (!isHsnFetchFieldId(field.id)) return field;
  if (field.dataSource?.type === 'netsuite_hsn') return field;
  return {
    ...field,
    dataSource: { ...NETSUITE_HSN_DATA_SOURCE },
  };
}

/** NetSuite Department REST search — PO body Classification + expense lines. */
export const NETSUITE_DEPARTMENT_DATA_SOURCE: DataSource = {
  type: 'netsuite_department',
  endpoint: 'departments/',
  apiConfig: {
    url: 'departments/',
    method: 'GET',
    labelKey: 'name',
    valueKey: 'internalId',
    searchKey: 'name',
  },
};

export const DEPARTMENT_FIELD_IDS = ['department', 'department_expense'] as const;

export function isDepartmentFieldId(fieldId: string): boolean {
  const id = fieldId.toLowerCase();
  if (DEPARTMENT_FIELD_IDS.includes(id as (typeof DEPARTMENT_FIELD_IDS)[number])) {
    return true;
  }
  return id.endsWith('_department') || id === 'dept';
}

export function formatDepartmentOptionLabel(row: {
  name?: string;
  subsidiary?: string;
  internalId?: string;
}): string {
  return formatNameSubsidiarySelectLabel(row);
}

export function formatDepartmentOptionTitle(row: {
  name?: string;
  subsidiary?: string;
  internalId?: string;
}): string {
  return formatNameSubsidiarySelectTitle(row);
}

export function applyDepartmentFieldDataSource(field: Field): Field {
  if (!isDepartmentFieldId(field.id)) return field;
  if (field.dataSource?.type === 'netsuite_department') return field;
  return {
    ...field,
    dataSource: { ...NETSUITE_DEPARTMENT_DATA_SOURCE },
  };
}

/** NetSuite Class REST — PO body Classification + expense lines. */
export const NETSUITE_CLASS_DATA_SOURCE: DataSource = {
  type: 'netsuite_class_live',
  endpoint: 'classes/',
  apiConfig: {
    url: 'classes/',
    method: 'GET',
    labelKey: 'name',
    valueKey: 'internalId',
    searchKey: 'name',
  },
};

export const CLASS_FIELD_IDS = ['class', 'class_expense'] as const;

export function isClassFieldId(fieldId: string): boolean {
  const id = fieldId.toLowerCase();
  if (CLASS_FIELD_IDS.includes(id as (typeof CLASS_FIELD_IDS)[number])) {
    return true;
  }
  return id.endsWith('_class') && id !== 'subclass';
}

export function formatClassOptionLabel(row: {
  name?: string;
  subsidiary?: string;
  internalId?: string;
}): string {
  return formatNameSubsidiarySelectLabel(row);
}

export function formatClassOptionTitle(row: {
  name?: string;
  subsidiary?: string;
  internalId?: string;
}): string {
  return formatNameSubsidiarySelectTitle(row);
}

export function applyClassFieldDataSource(field: Field): Field {
  if (!isClassFieldId(field.id)) return field;
  if (field.dataSource?.type === 'netsuite_class_live') return field;
  return {
    ...field,
    dataSource: { ...NETSUITE_CLASS_DATA_SOURCE },
  };
}

/** NetSuite GL Account REST — expense lines (searchable, paginated). */
export const NETSUITE_ACCOUNT_DATA_SOURCE: DataSource = {
  type: 'netsuite_account_live',
  endpoint: 'accounts/search',
  apiConfig: {
    url: 'accounts/search',
    method: 'GET',
    labelKey: 'name',
    valueKey: 'internalId',
    searchKey: 'name',
  },
};

export const ACCOUNT_FIELD_IDS = ['account', 'account_expense'] as const;

export function isAccountFieldId(fieldId: string): boolean {
  const id = fieldId.toLowerCase();
  return ACCOUNT_FIELD_IDS.includes(id as (typeof ACCOUNT_FIELD_IDS)[number]);
}

export function formatAccountOptionLabel(row: {
  number?: string;
  name?: string;
}): string {
  const num = String(row.number ?? '').trim();
  const name = String(row.name ?? '').trim();
  if (num && name) return `${num} - ${name}`;
  return num || name || 'Unknown';
}

export function formatAccountOptionTitle(row: {
  number?: string;
  name?: string;
  type?: string;
  generalratetype?: string;
  cashflowratetype?: string;
}): string {
  const parts = [
    formatAccountOptionLabel(row),
    row.type ? `Type: ${row.type}` : '',
    row.generalratetype ? `General rate: ${row.generalratetype}` : '',
    row.cashflowratetype ? `Cash flow: ${row.cashflowratetype}` : '',
  ].filter(Boolean);
  return parts.join('\n');
}

export function applyAccountFieldDataSource(field: Field): Field {
  if (!isAccountFieldId(field.id)) return field;
  if (field.dataSource?.type === 'netsuite_account_live') return field;
  return {
    ...field,
    dataSource: { ...NETSUITE_ACCOUNT_DATA_SOURCE },
  };
}

/** NetSuite Customer REST — SO / AR customer (searchable, paginated). */
export const NETSUITE_CUSTOMER_DATA_SOURCE: DataSource = {
  type: 'netsuite_customer_live',
  endpoint: 'customers/search',
  apiConfig: {
    url: 'customers/search',
    method: 'GET',
    labelKey: 'displayName',
    valueKey: 'internalId',
    searchKey: 'displayName',
  },
};

/** PO expense line, SO/AR body entity, etc. */
export function isCustomerFieldId(fieldId: string): boolean {
  const id = fieldId.toLowerCase();
  return id === 'customer' || id === 'customer_expense' || id === 'entity';
}

export function isCustomerEntityField(field: Field): boolean {
  const id = field.id.toLowerCase();
  if (field.dataSource?.type === 'netsuite_vendor_live') return false;
  if (id === 'customer_expense' || id === 'customer') return true;
  if (id !== 'entity') return false;
  const label = (field.label || '').trim().toLowerCase();
  if (label === 'vendor') return false;
  return label === 'customer' || label.includes('customer');
}

/** Infer live NetSuite datasource for entity/customer fields (used by FieldControl). */
export function resolveEntityLiveDataSource(
  fieldId: string | undefined,
  label: string | undefined,
  dataSource?: DataSource | null,
): DataSource | null {
  if (!fieldId) return null;
  const probe: Field = {
    id: fieldId,
    label: label || '',
    dataSource: dataSource ?? undefined,
    type: 'select',
    section: 'body',
    subSection: null,
    group: '',
    tab: '',
    visible: true,
    displayType: 'normal',
    mandatory: false,
    checkBoxDefault: 'default',
    defaultValue: '',
    layout: { columnBreak: false, spaceBefore: false },
  };
  if (isCustomerEntityField(probe)) {
    return {
      ...NETSUITE_CUSTOMER_DATA_SOURCE,
      ...(dataSource || {}),
      type: 'netsuite_customer_live',
    };
  }
  if (isVendorEntityField(probe)) {
    return {
      ...NETSUITE_VENDOR_DATA_SOURCE,
      ...(dataSource || {}),
      type: 'netsuite_vendor_live',
    };
  }
  return null;
}

export function formatCustomerOptionLabel(row: {
  displayName?: string;
  customerCode?: string;
}): string {
  const name = String(row.displayName ?? '').trim();
  if (name) return name;
  const code = String(row.customerCode ?? '').trim();
  return code || 'Unknown';
}

export function formatCustomerOptionTitle(row: {
  displayName?: string;
  customerCode?: string;
  email?: string;
  subsidiary?: string;
  address?: string;
}): string {
  const lines = [
    formatCustomerOptionLabel(row),
    row.customerCode ? `Code: ${row.customerCode}` : '',
    row.email ? `Email: ${row.email}` : '',
    row.subsidiary ? `Subsidiary: ${row.subsidiary}` : '',
    row.address ? `Address: ${row.address}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

export function applyCustomerFieldDataSource(field: Field): Field {
  if (!isCustomerEntityField(field)) return field;
  if (field.dataSource?.type === 'netsuite_customer_live') return field;
  return {
    ...field,
    dataSource: { ...NETSUITE_CUSTOMER_DATA_SOURCE },
  };
}

/** NetSuite Vendor REST — PO vendor (searchable, paginated). */
export const NETSUITE_VENDOR_DATA_SOURCE: DataSource = {
  type: 'netsuite_vendor_live',
  endpoint: 'vendors/search',
  apiConfig: {
    url: 'vendors/search',
    method: 'GET',
    labelKey: 'displayName',
    valueKey: 'internalId',
    searchKey: 'displayName',
  },
};

export function isVendorEntityField(field: Field): boolean {
  const id = field.id.toLowerCase();
  if (id !== 'entity') return false;
  return field.label.trim().toLowerCase() === 'vendor';
}

export function formatVendorOptionLabel(row: {
  displayName?: string;
  vendorCode?: string;
}): string {
  const name = String(row.displayName ?? '').trim();
  if (name) return name;
  const code = String(row.vendorCode ?? '').trim();
  return code || 'Unknown';
}

export function formatVendorOptionTitle(row: {
  displayName?: string;
  vendorCode?: string;
  email?: string;
  phone?: string;
  subsidiary?: string;
  address?: string;
}): string {
  const lines = [
    formatVendorOptionLabel(row),
    row.vendorCode ? `Code: ${row.vendorCode}` : '',
    row.email ? `Email: ${row.email}` : '',
    row.phone ? `Phone: ${row.phone}` : '',
    row.subsidiary ? `Subsidiary: ${row.subsidiary}` : '',
    row.address ? `Address: ${row.address}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

export function applyVendorFieldDataSource(field: Field): Field {
  if (!isVendorEntityField(field)) return field;
  if (field.dataSource?.type === 'netsuite_vendor_live') return field;
  return {
    ...field,
    dataSource: { ...NETSUITE_VENDOR_DATA_SOURCE },
  };
}

/** NetSuite Item REST — PO line items (searchable, paginated). */
export const NETSUITE_ITEM_DATA_SOURCE: DataSource = {
  type: 'netsuite_item_live',
  endpoint: 'items/search',
  apiConfig: {
    url: 'items/search',
    method: 'GET',
    labelKey: 'displayName',
    valueKey: 'internalId',
    searchKey: 'displayName',
  },
};

export const ITEM_LINE_FIELD_IDS = ['item'] as const;

export function isItemLineFieldId(fieldId: string): boolean {
  return fieldId.toLowerCase() === 'item';
}

export function formatItemOptionLabel(row: {
  displayName?: string;
  internalId?: string;
}): string {
  const name = String(row.displayName ?? '').trim();
  if (name) return name;
  const iid = String(row.internalId ?? '').trim();
  return iid || 'Unknown';
}

export function formatItemOptionTitle(row: {
  displayName?: string;
  itemCategory?: string;
  department?: string;
  className?: string;
  location?: string;
  hsnCode?: string;
  gstRate?: string;
}): string {
  const lines = [
    formatItemOptionLabel(row),
    row.itemCategory ? `Category: ${row.itemCategory}` : '',
    row.hsnCode ? `HSN: ${row.hsnCode}` : '',
    row.gstRate ? `GST: ${row.gstRate}` : '',
    row.department ? `Department: ${row.department}` : '',
    row.className ? `Class: ${row.className}` : '',
    row.location ? `Location: ${row.location}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

export function applyItemFieldDataSource(field: Field): Field {
  if (!isItemLineFieldId(field.id)) return field;
  if (field.dataSource?.type === 'netsuite_item_live') return field;
  return {
    ...field,
    dataSource: { ...NETSUITE_ITEM_DATA_SOURCE },
  };
}

/** Apply all NetSuite live master-data presets for known field ids. */
export function applyFormFieldDataSource(field: Field): Field {
  return applyCustomerFieldDataSource(
    applyVendorFieldDataSource(
    applyItemFieldDataSource(
      applyAccountFieldDataSource(
        applyTaxNatureFieldDataSource(
          applyClassFieldDataSource(
            applyDepartmentFieldDataSource(
              applyHsnFieldDataSource(applyLocationFieldDataSource(field)),
            ),
          ),
        ),
      ),
    ),
    ),
  );
}
