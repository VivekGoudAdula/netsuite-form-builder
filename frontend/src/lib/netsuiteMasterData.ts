import type { DataSource, Field } from '../types';

/** NetSuite HSN REST search — used on PO line items only. */
export const NETSUITE_HSN_DATA_SOURCE: DataSource = {
  type: 'netsuite_hsn',
  endpoint: 'hsn-codes/search',
  apiConfig: {
    url: 'hsn-codes/search',
    method: 'GET',
    labelKey: 'name',
    valueKey: 'internalId',
    searchKey: 'hsncode',
  },
};

/** Canonical + custom column ids for HSN on item sublists. */
export const HSN_LINE_FIELD_IDS = ['hsncode', 'custcol_hsn_code', 'hsn_code'] as const;

export function isHsnLineFieldId(fieldId: string): boolean {
  const id = fieldId.toLowerCase();
  return (
    HSN_LINE_FIELD_IDS.includes(id as (typeof HSN_LINE_FIELD_IDS)[number]) ||
    id.includes('hsncode') ||
    id.includes('hsn_code') ||
    id.endsWith('_hsn')
  );
}

/** Preferred PO line column order (tax classification after item). */
export const PO_ITEM_SUBLIST_FIELD_ORDER: string[] = [
  'item',
  'hsncode',
  'custcol_hsn_code',
  'hsn_code',
  'quantity',
  'rate',
  'taxcode',
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

export function createHsnLineItemField(): Field {
  return {
    id: 'hsncode',
    label: 'HSN Code',
    type: 'select',
    section: 'sublist',
    subSection: 'item',
    group: 'Line Items',
    tab: 'Items',
    mandatory: false,
    visible: true,
    displayType: 'normal',
    checkBoxDefault: 'default',
    helpText: 'Item-level tax classification (GST). Synced from NetSuite HSN master.',
    defaultValue: '',
    layout: { columnBreak: false, spaceBefore: false },
    dataSource: { ...NETSUITE_HSN_DATA_SOURCE },
  };
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
  endpoint: 'locations/search',
  apiConfig: {
    url: 'locations/search',
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

export function formatLocationOptionLabel(row: {
  name?: string;
  subsidiary?: string;
}): string {
  const name = String(row.name ?? '').trim();
  const sub = String(row.subsidiary ?? '').trim();
  if (name && sub) return `${name} (${sub})`;
  return name || sub || 'Unknown';
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
